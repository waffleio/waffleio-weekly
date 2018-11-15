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

app.get('/raw', (req, res) => {
    
    
    generateStatusReport() 
    .then(statusReport => {
        res.write(statusReport)
        res.end()
    })   
})

app.get('/', (req, res) => {
    generateStatusReport2()
    .then(epicIssues => {
        res.render('report', {
            title: "Waffle.io Progress Report",
            message: "Waffle.io Progress Report",
            epics: epicIssues
        })
    })  
})

async function getProject(id) {
    const response = await axios.get(`https://api.waffle.io/project/${id}`)
    return response.data
}

async function getIssuesForProject(id) {
    const response = await axios.get(`https://api.waffle.io/projects/${id}/cards`)
    return response.data
}

function addEpicPropertyToIssues(issues) {
    
    issues.forEach(issue => {
        
        if(issue.relationships) {
            let isEpic = issue.relationships.some(issueRelationship => {
                
                if (issueRelationship.relationship === 'parent') {
                    return true
                } 
                
            })

            if(isEpic) {
                issue.isEpic = true
            } else {
                issue.isEpic = false
            }
        } 

        if(issue.isEpic === true) {

            if(issue.githubMetadata.labels) {
                let isEpicInProgress = issue.githubMetadata.labels.some(label => {
                    
                    if (label.name === 'waffle:in progress') {
                        return true
                    } 

                })

                if(isEpicInProgress) {
                    issue.isEpicInProgress = true
                } else {
                    issue.isEpicInProgress = false
                }
            }
        }
    })
}

function addChildPropertyToIssues(issues) {
      
    issues.forEach(issue => {
        if(issue.relationships) {
            let isChild = issue.relationships.some(issueRelationship => {
                
                if (issueRelationship.relationship === 'child') {
                    return true
                }
    
            })
            if(isChild) {
                issue.isChild = true
            } else {
                issue.isChild = false
            }
        }
    })
}

async function generateEpicStatus(epicIssues) {
    let epicStatus = 'EPICS (in progress)'
    
    epicIssues.forEach(epic => {
        epicStatus += '\n\n   EPIC:' + epic.githubMetadata.title

        epicStatus += '\n\n      OPEN ISSUES in EPIC'

        epic.relationships.forEach(issueRelationship => {
            if(issueRelationship.relationship === 'parent') {
                if(issueRelationship.to.githubMetadata.state === 'open') {
                    epicStatus += `\n         * "${issueRelationship.to.githubMetadata.title}" is ${issueRelationship.to.githubMetadata.state.toUpperCase()}`
                }
            }
        })

        epicStatus += '\n\n      CLOSED ISSUES in EPIC'

        epic.relationships.forEach(issueRelationship => {
            if(issueRelationship.relationship === 'parent') {
                if(issueRelationship.to.githubMetadata.state === 'closed') {
                    epicStatus += `\n         * "${issueRelationship.to.githubMetadata.title}" is ${issueRelationship.to.githubMetadata.state.toUpperCase()}`
                }
            }
        })
    })

    return epicStatus
}

async function generateOrphanStatus(orphanIssues) {
    let orphanStatus = 'ISSUES (without parents)'
    
    orphanStatus += '\n\n   ISSUES (in progress)'
    orphanStatus += '\n\n      TODO: not implemented'

    orphanStatus += '\n\n   NEW ISSUES'
    orphanIssues.forEach(issue => {
        if(issue.githubMetadata.state === 'open') {
            if(Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw) {
                orphanStatus += `\n     * "${issue.githubMetadata.title}" is ${issue.githubMetadata.state.toUpperCase()}`
            }
        }  
    })

    orphanStatus += '\n\n   CLOSED ISSUES'
    orphanIssues.forEach(issue => {
        if(issue.githubMetadata.state === 'closed') {
            if(Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw) {
                orphanStatus += `\n     * "${issue.githubMetadata.title}" is ${issue.githubMetadata.state.toUpperCase()}`
            }
        }  
    })

    return orphanStatus
}

async function generateStatusReport() {
            
            let project = await getProject(waffleProjectId)

            let issues = await getIssuesForProject(project._id)

            await addEpicPropertyToIssues(issues)
            const epicIssuesInProgress = issues.filter(issue => issue.isEpicInProgress === true)
            const epicStatus = await generateEpicStatus(epicIssuesInProgress)

            await addChildPropertyToIssues(issues)
            const orphanIssues = issues.filter(issue => issue.isChild === false)
            const orphinStatus = await generateOrphanStatus(orphanIssues)

            const statusReport = 'Waffle.io Progress Report\n' 
                                    + `for ${project.name}\n\n`
                                    + epicStatus 
                                    + '\n\n' 
                                    + orphinStatus

            return statusReport
}

async function generateStatusReport2() {
            
    let project = await getProject(waffleProjectId)

    let issues = await getIssuesForProject(project._id)

    await addEpicPropertyToIssues(issues)
    const epicIssues = issues.filter(issue => issue.isEpic === true)
    
    return epicIssues
}

app.listen(3000)
console.log('listening on port 3000...')