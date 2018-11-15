const axios = require('axios')
const moment = require('moment');

axios.defaults.headers.common['Authorization'] = 'bearer ' + process.env.waffleApiSecret

//const waffleProjectId = '5be5aab3b10da50134293eea' // https://waffle.io/adamzolyak/test-letswafflebot
const waffleProjectId = '52e041cfe045b8ac35fe4620' // https://waffle.io/waffleio/waffle.io


const todaysDate = moment().format('YYYY-MM-DD')
const todaysDateRaw = moment()
const reportSinceDateRaw = todaysDateRaw - (60 * 1000 * 60 * 24 * 7) // since 1 week ago

const http = require('http')

const server = http.createServer((req, res) => {
    if (req.url === '/') {    
        generateStatusReport() 
        .then(statusReport => {
            res.write(statusReport)
            res.end()
        })
        
    } else {
        res.write('not found')
        res.end()
    }
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
                let isParent = false
                if (issueRelationship.relationship === 'parent') {
                    isParent = true
                }
                return isParent
            })

            if(isEpic) {
                issue.isEpic = true
            }
        } 

        if(issue.isEpic === true) {

            if(issue.githubMetadata.labels) {
                let isEpicInProgress = issue.githubMetadata.labels.some(label => {
                    let isEpicInProgress = false
                    if (label.name === 'waffle:in progress') {
                        isEpicInProgress = true
                    }
                    return isEpicInProgress
                })

                if(isEpicInProgress) {
                    issue.isEpicInProgress = true
                }
            }
        }
    })
}

function addOrphanPropertyToIssues(issues) {
    
    issues.forEach(issue => {
        let isOrphan = issue.relationships.some(issueRelationship => {
            let isChild = false
            if (issueRelationship.relationship === 'child') {
                isChild = true
            }
            return isChild
        })
        if(isOrphan) {
            issue.isOrphan = true
        }
    })
}

async function generateEpicStatus(epicIssues) {
    let epicStatus = 'EPICS'
    
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
            const epicIssues = issues.filter(issue => issue.isEpic === true)
            const epicIssuesInProgress = issues.filter(issue => issue.isEpicInProgress === true)
            const epicStatus = await generateEpicStatus(epicIssuesInProgress)

            await addOrphanPropertyToIssues(issues)
            const orphanIssues = issues.filter(issue => issue.isOrphan === true)
            const orphinStatus = await generateOrphanStatus(orphanIssues)

            const statusReport = 'Waffle.io Progress Report\n' 
                                    + `for ${project.name}\n\n`
                                    + epicStatus 
                                    + '\n\n' 
                                    + orphinStatus

            return statusReport
            
            /*

            reportSinceDateRaw

            let closedIssues = issues.filter(issue => Date.parse(issue.githubMetadata.closed_at) > (todaysDateRaw - (60 * 1000 * 60 * 24 * 7)))

            let closedIssuesHTML = 'Closed Issues\n'

            closedIssues.forEach(issue => {
                closedIssuesHTML += issue.githubMetadata.title + '\n'
            });

            */

            
            

}



//Closed Issues

// ... Epics + Child Issues

// ... Unparented Issues

//New Issues

server.listen(3000)
console.log('listening on port 3000...')