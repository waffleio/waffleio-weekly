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
const daysToReport = 2
const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

const waffleProjectId = process.env.waffleProjectId

const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - (60 * 1000 * 60 * 24 * daysToReport) // since 1 day ago

const waffleAPI = axios.create({
    baseURL: 'https://api.waffle.io/',
    timeout: 10000,
    headers: {'Authorization': 'bearer ' + process.env.waffleApiSecret}
})

async function getProject(id) {
    const response = await waffleAPI.get(`project/${id}`)
    return response.data
}

async function getIssuesForProject(id) {
    const response = await waffleAPI.get(`projects/${id}/cards`)
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
    if(issue.githubMetadata.number == 395) {
        console.log(issue)
    }
    return issue
}

app.get('/', async (req, res) => {
    let project = await getProject(waffleProjectId)
    let issues = await getIssuesForProject(project._id)
    issues = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)
    let ornamentedIssues = await Promise.all(issues.map(ornamentIssueMap))

    res.render('report', {
        title: "Waffle.io Progress Report",
        message: "Waffle.io Progress Report",
        project: project.name,
        days: daysToReport,
        newIssues: await issuesHelpers.getNewIssues(ornamentedIssues, reportSinceDateRaw),
        updatedOrphanIssues: await issuesHelpers.getInProgressIssues(ornamentedIssues),
        closedIssues: await issuesHelpers.getClosedIssues(ornamentedIssues, reportSinceDateRaw),
        svgTest: octicons.bell.toSVG()
    }) 
        
    issuesHelpers.printGHApiCountUsed()
})

app.listen(3000)
console.log('listening on port 3000...')

issuesHelpers.getGHApiRateLimitRemaining()
