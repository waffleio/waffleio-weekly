const helpers = require('./helpers')
const _ = require('lodash')
const axios = require('axios')
const moment = require('moment')
const helmet = require('helmet')
const express = require('express')
const app = express()

app.set('view engine', 'pug')
app.set('views', './views')

app.use(helmet())

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

const todaysDate = moment().format('YYYY-MM-DD')
const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - (60 * 1000 * 60 * 24 * 1) // since 1 day ago

async function getProject(id) {
    const response = await waffleAPI.get(`project/${id}`)
    return response.data
}

async function getIssuesForProject(id) {
    const response = await waffleAPI.get(`projects/${id}/cards`)
    return response.data
}

async function getIssueDetail(url) {
    const response = await ghAPI.get(url)
        .then(response => {
            return response
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })

    ghApiCount ++
    return response.data
}

async function getIssueCommentsDetail(url) {
    const response = await ghAPI.get(url)
        .then(response => {
            return response
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })

    ghApiCount ++
    return response.data
}

async function getEpicIssues(issues) {
    let issueSubset = issues.filter(issue => issue.isEpic === true)
    issueSubset = issueSubset.filter(issue => issue.isInProgress === true)

    return issueSubset 
}

async function getUpdatedOrphanIssues(issues) {
    let issueSubset = issues.filter(issue => issue.isChild === false)
    issueSubset = issueSubset.filter(issue => issue.isEpic === false)
    issueSubset = issueSubset.filter(issue => issue.githubMetadata.state === 'open')
    issueSubset = issues.filter(issue => issue.isInProgress === true)
    issueSubset = issueSubset.filter(issue => Date.parse(issue.githubMetadata.updated_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.githubMetadata.updated_at != issue.githubMetadata.created_at)
    
    issueSubset = _.orderBy(issueSubset, ['githubMetadata.updated_at'], ['asc'])

    return issueSubset 
}

async function getClosedIssues(issues) {
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.githubMetadata.state === 'closed')
    return issueSubset 
}

async function getNewIssues(issues) {

    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw)

    issueSubset = _.orderBy(issueSubset, ['githubMetadata.state', 'githubMetadata.created_at'], ['asc', 'asc'])

    return issueSubset 
}

async function getIssueCreator(issue) {
    return issue.user.login 
}

async function getNewCommentCount(comments) {
    let commentSubset = comments.filter(comment => Date.parse(comment.created_at) > reportSinceDateRaw)
    return commentSubset.length
}

async function pruneOldIssues(issues) {
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw || Date.parse(issue.githubMetadata.updated_at) > reportSinceDateRaw || Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw)
    
    return issueSubset
}

async function ornamentIssues(issues) {

    for(let issue of issues) {
        issue.isEpic = await helpers.checkIfEpic(issue)
        issue.isInProgress = await helpers.checkIfInProgress(issue)
        issue.isChild = await helpers.checkIfChild(issue)

        const issueDetail = await getIssueDetail(issue.githubMetadata.url)
        if(issueDetail) {
            issue.creator = await getIssueCreator(issueDetail)
            
            const issueCommentsDetail = await getIssueCommentsDetail(issueDetail.comments_url)
            if(issueCommentsDetail) issue.newComments = await getNewCommentCount(issueCommentsDetail)
        }
    }    
    return issues   
}

app.get('/', async (req, res) => {
    let project = await getProject(waffleProjectId)
    let issues = await getIssuesForProject(project._id)
    issues = await pruneOldIssues(issues)
    issues = await ornamentIssues(issues)

    res.render('report', {
        title: "Waffle.io Progress Report",
        message: "Waffle.io Progress Report",
        project: project.name,
        epics: await getEpicIssues(issues),
        newIssues: await getNewIssues(issues),
        updatedOrphanIssues: await getUpdatedOrphanIssues(issues),
        closedIssues: await getClosedIssues(issues)
    }) 

    console.log('GH API Count: ' + ghApiCount)
})

app.listen(3000)
console.log('listening on port 3000...')
