const axios = require('axios')
const moment = require('moment')
const helmet = require('helmet')
const express = require('express')
const app = express()

app.set('view engine', 'pug')
app.set('views', './views')

app.use(helmet())

axios.defaults.headers.common['Authorization'] = 'bearer ' + process.env.waffleApiSecret

const waffleProjectId = process.env.waffleProjectId

const todaysDate = moment().format('YYYY-MM-DD')
const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - (60 * 1000 * 60 * 24 * 7) // since 1 week ago

const http = require('http')

async function getProject(id) {
    const response = await axios.get(`https://api.waffle.io/project/${id}`)
    return response.data
}

async function getIssuesForProject(id) {
    const response = await axios.get(`https://api.waffle.io/projects/${id}/cards`)
    return response.data
}

async function getEpicIssues(issues) {
    let issueSubset = issues.filter(issue => issue.isEpic === true)
    return issueSubset 
}

async function getUpdatedOrphanIssues(issues) {
    let issueSubset = issues.filter(issue => issue.isChild === true)
    issueSubset = issueSubset.filter(issue => Date.parse(issue.githubMetadata.updated_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.isEpic === false)
    return issueSubset 
}

async function getClosedIssues(issues) {
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.githubMetadata.state === 'closed')
    return issueSubset 
}

async function getNewIssues(issues) {

    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw)
    return issueSubset 
}

function checkIfEpic(issue) {   

    let isEpic = false

    if(issue.relationships) {
        isEpic = issue.relationships.some(issueRelationship => {
            
            if (issueRelationship.relationship === 'parent') {
                return true
            }      
        })
    } 

    return isEpic
}

function checkIfEpicInProgress(issue) {
    
    let isEpicInProgress = false

    if(issue.isEpic === true) {

        if(issue.githubMetadata.labels) {
            isEpicInProgress = issue.githubMetadata.labels.some(label => {
                
                if (label.name === 'waffle:in progress') {
                    return true
                } 
            })
        }
    }

    return isEpicInProgress
}

function checkIfChild(issue) {
    let isChild = false
    
    if(issue.relationships) {
        isChild = issue.relationships.some(issueRelationship => {
            
            if (issueRelationship.relationship === 'child') {
                return true
            }

        })
    }

    return isChild
}

async function ornamentIssues(issue) {

    issue.isEpic = checkIfEpic(issue)
    issue.isEpicInProgress = checkIfEpicInProgress(issue)
    issue.isChild = checkIfChild(issue)

    return issue
}

app.get('/', async (req, res) => {
    let project = await getProject(waffleProjectId)
    let issues = await getIssuesForProject(project._id)
    await issues.map(ornamentIssues)

    res.render('report', {
        title: "Waffle.io Progress Report",
        message: "Waffle.io Progress Report",
        project: project.name,
        epics: await getEpicIssues(issues),
        newOrphanIssues: await getNewIssues(issues),
        updatedOrphanIssues: await getUpdatedOrphanIssues(issues),
        closedOrphanIssues: await getClosedIssues(issues)
    }) 
})

app.listen(3000)
console.log('listening on port 3000...')

module.exports.isEpic = checkIfEpic
module.exports.isEpicInProgress = checkIfEpicInProgress
module.exports.isChild = checkIfChild
module.exports.ornamentIssues = ornamentIssues