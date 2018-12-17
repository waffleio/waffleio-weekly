const issueHelpers = require('./issue')
const issuesHelpers = require('./issues')
const axios = require('axios')
const moment = require('moment')
const mailer = require('pug-mailer')
const helmet = require('helmet')
const express = require('express')
const app = express()
require('dotenv').config()

app.set('view engine', 'pug')
app.set('views', './views')

app.use(helmet())

//config for your project
const daysToReport = process.env.daysToReport
const webReportEnabled = process.env.webReportEnabled
const inProgressLabels = process.env.inProgressLabels.split(',')

mailer.init({
  service: 'Mailgun',
  auth: {
    user: process.env.mailgunUser,
    pass: process.env.mailgunPass
  }
})

const mailFrom = process.env.mailgunFrom
const mailTo = process.env.mailgunTo.split(',').join(',')
console.log('Mail To: ' + mailTo)

const waffleProject = process.env.waffleProject

console.log(`Project: ${waffleProject}`)
console.log(`Days to Report: ${daysToReport}`)
console.log(`Web Report Enabled: ${webReportEnabled}`)

const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - 60 * 1000 * 60 * 24 * daysToReport // since 1 day ago

const waffleAPI = axios.create({
  baseURL: 'https://api.waffle.io/',
  timeout: 10000,
  headers: { Authorization: 'bearer ' + process.env.waffleApiSecret }
})

async function getReposForProject(project) {
  const url = `projects/${project}`

  return await waffleAPI
    .get(url)
    .then(response => {
      return response.data
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
        return error.response.status
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
        return 500
      }
    })
}

async function getIssuesForProject(project) {
  const url = `${project}/cards`

  return await waffleAPI
    .get(url)
    .then(response => {
      return response.data
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
        return error.response.status
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
        return 500
      }
    })
}

async function ornamentIssuePrePruneMap(issue) {
  issue.isInProgress = await issueHelpers.checkIfInProgress(
    issue,
    inProgressLabels
  )
  issue.isChild = await issueHelpers.checkIfChild(issue)

  return issue
}

async function ornamentIssueMap(issue) {
  issue.isEpic = await issueHelpers.checkIfEpic(issue)
  issue.epics = await issueHelpers.getEpics(issue.relationships)
  //issue.isInProgress = await issueHelpers.checkIfInProgress(issue, inProgressLabels)
  issue.currentState = await issueHelpers.getInProgressLabel(
    issue,
    inProgressLabels
  )
  issue.isPR = await issueHelpers.checkIfPR(issue)
  issue.PRs = await issueHelpers.getPRs(issue.relationships)
  issue.assignees = await issueHelpers.getAssignees(
    issue.githubMetadata.assignees
  )

  const issueDetail = await issuesHelpers.getIssueDetail(
    issue.githubMetadata.url
  )
  if (issueDetail) {
    issue.creator = issueDetail.user.login

    const issueCommentsDetail = await issuesHelpers.getIssueCommentsDetail(
      issueDetail.comments_url
    )
    if (issueCommentsDetail) {
      issue.newComments = await issueHelpers.getNewComments(
        issueCommentsDetail,
        reportSinceDateRaw
      )
    } else {
      issue.newComments = []
    }

    const issueEventsDetail = await issuesHelpers.getIssueEventsDetail(
      issueDetail.events_url
    )
    if (issueEventsDetail) {
      issue.daysInCurrentState = issueHelpers.getDaysInState(
        issueEventsDetail,
        issue.currentState,
        moment()
      )
    }
  }

  return issue
}

async function ornamentEpicMap(epic) {
  let epicChildren = []

  epic.relationships.forEach(relationship => {
    if (relationship.relationship === 'parent') {
      let issueSubset = Array.from(this.issues)
      issueSubset = issueSubset.filter(issue => relationship.to.id === issue.id)

      if (issueSubset.length == 1) {
        epicChildren.push(issueSubset[0])
      }
    }
  })

  epic.childIssues = epicChildren

  return epic
}

async function getReportData() {
  let issues = await getIssuesForProject(waffleProject)
  issues = await Promise.all(issues.map(ornamentIssuePrePruneMap))
  issues = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)
  issues = await Promise.all(issues.map(ornamentIssueMap))

  let epicIssues = await issuesHelpers.getEpicIssues(issues)
  epicIssues = await Promise.all(epicIssues.map(ornamentEpicMap, { issues }))

  const reportData = {
    title: '📈 Waffle.io Progress Report',
    message: '📈 Waffle.io Progress Report',
    project: waffleProject,
    days: daysToReport,
    epics: epicIssues,
    newIssues: await issuesHelpers.getNewIssues(issues, reportSinceDateRaw),
    updatedOrphanIssues: await issuesHelpers.getInProgressOrphanIssues(issues),
    closedIssues: await issuesHelpers.getClosedIssues(
      issues,
      reportSinceDateRaw
    )
  }

  return reportData
}

async function getIssuesForProject() {
  let repos = await getReposForProject(waffleProject)

  let issues = []

  for (source of repos.sources) {
    const repo = source.repoPath
    const state = 'closed'
    const daysSince = 365
    const issuesForRepo = await issuesHelpers.getIssuesForRepo(
      repo,
      state,
      daysSince
    )

    for (issue of issuesForRepo) {
      issues.push(issue)
    }
  }
  return issues
}

function logLabelStats(issues, labelToMatch) {
  const totalLabels = issues.length

  const issuesWithLabel = issues.filter(issue => {
    return issue.labels.some(label => {
      return label.name === labelToMatch
    })
  })

  const percentOfLabels = parseInt((issuesWithLabel.length / totalLabels) * 100)

  console.log(
    `${percentOfLabels}% ${labelToMatch} (${
      issuesWithLabel.length
    } of ${totalLabels} issues)`
  )
}

async function getAllocationData() {
  const issues = await getIssuesForProject()

  const labels = [
    'Eats',
    'Adventures!',
    'Family',
    'Chores / Metawork',
    'Friends / Relationships',
    'Making',
    'Wellness & Growth',
    'Work',
    'Truck Camper 🚚',
    'JAI 🧠',
    'BFAT! 🤟🤟🤟'
  ]
  labels.forEach(label => {
    logLabelStats(issues, label)
  })
}

app.get('/', async (req, res) => {
  const ghRateLimitStatus = await issuesHelpers.getGHApiRateLimitRemaining()

  if (ghRateLimitStatus == 200) {
    if (webReportEnabled === 'true') {
      const reportData = await getReportData()

      res.status(200).render('report', reportData)

      issuesHelpers.printGHApiCountUsed()
    } else {
      console.log('Web report is disabled.  Try email.')
      res.status(200).send('Web report is disabled.  Try email.')
    }
  } else {
    console.log(`Error: status ${ghRateLimitStatus}`)
  }
})

app.get('/allocation', async (req, res) => {
  const ghRateLimitStatus = await issuesHelpers.getGHApiRateLimitRemaining()

  if (ghRateLimitStatus == 200) {
    if (webReportEnabled === 'true') {
      const reportData = await getAllocationData()

      res.status(200)

      return

      res.status(200).render('report', reportData)

      issuesHelpers.printGHApiCountUsed()
    } else {
      console.log('Web report is disabled.  Try email.')
      res.status(200).send('Web report is disabled.  Try email.')
    }
  } else {
    console.log(`Error: status ${ghRateLimitStatus}`)
  }
})

app.get('/email', async (req, res) => {
  const ghRateLimitStatus = await issuesHelpers.getGHApiRateLimitRemaining()

  if (ghRateLimitStatus == 200) {
    const reportData = await getReportData()

    mailer
      .send({
        from: mailFrom,
        to: mailTo,
        subject: `${reportData.title} for ${reportData.project}`,
        template: __dirname + '/views/report.pug',
        data: reportData
      })
      .then(response => {
        console.log('Email Successfully Sent!')
        res.status(200).send('Email Successfully Sent!')
      })
      .catch(err => {
        console.log('Something went wrong!  Email not sent.')
        console.log(err)
        res.status(500).send('Something went wrong!  Email not sent.')
      })

    issuesHelpers.printGHApiCountUsed()
  } else {
    console.log(`Error: status ${ghRateLimitStatus}`)
  }
})

app.listen(3000)
console.log('listening on port 3000...')
