const issueHelpers = require('./issue')
const _ = require('lodash')
const axios = require('axios')
const moment = require('moment')
const octicons = require("octicons")
const helmet = require('helmet')
const express = require('express')
const app = express()

app.set('view engine', 'pug')
app.set('views', './views')

app.use(helmet())

//config for your project
const daysToReport = 2
const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

let ghApiCount = 0

const waffleAPI = axios.create({
    baseURL: 'https://api.waffle.io/',
    timeout: 10000,
    headers: {'Authorization': 'bearer ' + process.env.waffleApiSecret}
})

const ghAPI = axios.create({
    timeout: 10000,
    headers: {'Authorization': 'token ' + process.env.ghApiToken}
})

const waffleProjectId = process.env.waffleProjectId

const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - (60 * 1000 * 60 * 24 * daysToReport) // since 1 day ago

async function getProject(id) {
    const response = await waffleAPI.get(`project/${id}`)
    return response.data
}

async function getIssuesForProject(id) {
    const response = await waffleAPI.get(`projects/${id}/cards`)
    return response.data
}

async function getGHAPIRateLimit() {
    const url = 'https://api.github.com/rate_limit'

    return await ghAPI.get(url)
        .then(response => {
            console.log(`GH API Remaining Calls: ${response.data.rate.remaining}`)
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}

async function getIssueDetail(url) {
    ghApiCount ++
    
    return await ghAPI.get(url)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}

async function getIssueEventsDetail(url) {
    ghApiCount ++

    return await ghAPI.get(url)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}


async function getIssueCommentsDetail(url) {
    ghApiCount ++
    
    return await ghAPI.get(url)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}

async function getInProgressIssues(issues) {
    let issueSubset = issues.filter(issue => issue.githubMetadata.state === 'open')
    issueSubset = issueSubset.filter(issue => issue.isEpic === false)
    issueSubset = issueSubset.filter(issue => issue.isInProgress === true)
    issueSubset = issueSubset.filter(issue => issue.isPR === false)
    
    issueSubset = _.orderBy(issueSubset, ['githubMetadata.updated_at'], ['asc'])
    
    return issueSubset 
}

async function getClosedIssues(issues) {
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.githubMetadata.state === 'closed')
    issueSubset = issueSubset.filter(issue => issue.isPR === false)

    issueSubset = _.orderBy(issueSubset, ['githubMetadata.closed_at_at'], ['asc'])

    return issueSubset 
}

async function getNewIssues(issues) {

    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.isPR === false)

    issueSubset = _.orderBy(issueSubset, ['githubMetadata.state', 'githubMetadata.created_at'], ['desc', 'asc'])

    return issueSubset 
}

async function pruneOldIssues(issues) {
    console.log('Total Issues: ' + issues.length)
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw || Date.parse(issue.githubMetadata.updated_at) > reportSinceDateRaw || Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw)
    console.log('Remaining Issues: ' + issueSubset.length)
    return issueSubset
}

async function ornamentIssueMap(issue) {
    issue.isEpic = await issueHelpers.checkIfEpic(issue)
    issue.epics = await issueHelpers.getEpics(issue.relationships)
    issue.isInProgress = await issueHelpers.checkIfInProgress(issue, inProgressLabels)
    issue.currentState = await issueHelpers.getInProgressLabel(issue, inProgressLabels)
    issue.isChild = await issueHelpers.checkIfChild(issue)
    issue.isPR = await issueHelpers.checkIfPR(issue)
    issue.PRs = await issueHelpers.getPRs(issue.relationships)
    issue.assignees = await issueHelpers.getAssignees(issue.githubMetadata.assignees)

    const issueDetail = await getIssueDetail(issue.githubMetadata.url)
        if(issueDetail) {
            issue.creator = issueDetail.user.login 
            
            const issueCommentsDetail = await getIssueCommentsDetail(issueDetail.comments_url)
            if(issueCommentsDetail) {
                issue.newComments = await issueHelpers.getNewComments(issueCommentsDetail, reportSinceDateRaw)
            } else {
                issue.newComments = []
            }

            const issueEventsDetail = await getIssueEventsDetail(issueDetail.events_url)
            if(issueEventsDetail) {
                issue.daysInCurrentState = issueHelpers.getDaysInState(issueEventsDetail, issue.currentState, moment())
            }
        }
    if(issue.githubMetadata.number == 395) {
        console.log(issue)
    }
    return issue
}

app.get('/', async (req, res) => {
    let project = await getProject(waffleProjectId)
    let issues = await getIssuesForProject(project._id)
    issues = await pruneOldIssues(issues)
    let ornamentedIssues = await Promise.all(issues.map(ornamentIssueMap))

    res.render('report', {
        title: "Waffle.io Progress Report",
        message: "Waffle.io Progress Report",
        project: project.name,
        days: daysToReport,
        newIssues: await getNewIssues(ornamentedIssues),
        updatedOrphanIssues: await getInProgressIssues(ornamentedIssues),
        closedIssues: await getClosedIssues(ornamentedIssues),
        svgTest: octicons.bell.toSVG()
    }) 
        
    console.log('GH API Count: ' + ghApiCount)
})

app.listen(3000)
console.log('listening on port 3000...')

getGHAPIRateLimit()
