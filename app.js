const issueHelpers = require('./issue')
const issuesHelpers = require('./issues')
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
const daysToReport = process.env.daysToReport
const inProgressLabels = process.env.inProgressLabels.split('|');

const waffleProject = process.env.waffleProject

const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - (60 * 1000 * 60 * 24 * daysToReport) // since 1 day ago

const waffleAPI = axios.create({
    baseURL: 'https://api.waffle.io/',
    timeout: 10000,
    headers: {'Authorization': 'bearer ' + process.env.waffleApiSecret}
})

async function getProject(project) {
    const response = await waffleAPI.get(`${project}/cards`)
    return response.data
}

async function getIssuesForProject(project) {
    const response = await waffleAPI.get(`${project}/cards`)
    return response.data
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

    const issueDetail = await issuesHelpers.getIssueDetail(issue.githubMetadata.url)
        if(issueDetail) {
            issue.creator = issueDetail.user.login 
            
            const issueCommentsDetail = await issuesHelpers.getIssueCommentsDetail(issueDetail.comments_url)
            if(issueCommentsDetail) {
                issue.newComments = await issueHelpers.getNewComments(issueCommentsDetail, reportSinceDateRaw)
            } else {
                issue.newComments = []
            }

            const issueEventsDetail = await issuesHelpers.getIssueEventsDetail(issueDetail.events_url)
            if(issueEventsDetail) {
                issue.daysInCurrentState = issueHelpers.getDaysInState(issueEventsDetail, issue.currentState, moment())
            }
        }

    return issue
}

async function ornamentEpicMap(epic) {
    let epicChildren = []

    epic.relationships.forEach(relationship => {
        if(relationship.relationship === 'parent') {
            let issueSubset = Array.from(this.issues)
            issueSubset = issueSubset.filter(issue => relationship.to.id === issue.id)

            if(issueSubset.length == 1) {
                epicChildren.push(issueSubset[0])
            }
        }
    }) 

    epic.childIssues = epicChildren

    return epic
}

app.get('/', async (req, res) => {
    //let project = await getProject(waffleProject)
    let issues = await getIssuesForProject(waffleProject)
    issues = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)
    issues = await Promise.all(issues.map(ornamentIssueMap))

    let epicIssues = await issuesHelpers.getEpicIssues(issues)
    epicIssues = await Promise.all(epicIssues.map(ornamentEpicMap, {issues}))

    res.render('report', {
        title: "📈 Waffle.io Progress Report",
        message: "📈 Waffle.io Progress Report",
        project: waffleProject,
        days: daysToReport,
        epics: epicIssues,
        newIssues: await issuesHelpers.getNewIssues(issues, reportSinceDateRaw),
        updatedOrphanIssues: await issuesHelpers.getInProgressIssues(issues),
        closedIssues: await issuesHelpers.getClosedIssues(issues, reportSinceDateRaw),
        svgTest: octicons.bell.toSVG()
    }) 
        
    issuesHelpers.printGHApiCountUsed()
})

app.listen(3000)
console.log('listening on port 3000...')

issuesHelpers.getGHApiRateLimitRemaining()
