const axios = require('axios')
const moment = require('moment');

axios.defaults.headers.common['Authorization'] = 'bearer ' + process.env.waffleApiSecret

const waffleUserProjectsURL = `https://api.waffle.io/projects/5be5aab3b10da50134293eea/cards`

const todaysDate = moment().format('YYYY-MM-DD')
const todaysDateRaw = moment()

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

async function getIssuesForProject() {
    const response = await axios.get(waffleUserProjectsURL)
    return response.data
}

function addEpicPropertyToIssues(issues) {
    
    issues.forEach(issue => {
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
    })
}

function addOrphanPropertyToIssues(issues) {
    
    issues.forEach(issue => {
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
    })
}

async function generateEpicStatus(epicIssues) {
    let epicStatus = 'Epic Status Report'
    
    epicIssues.forEach(epic => {
        epicStatus += '\n\n' + epic.githubMetadata.title + '\n'

        epic.relationships.forEach(issueRelationship => {
            if(issueRelationship.relationship === 'parent') {
                epicStatus += `     "${issueRelationship.to.githubMetadata.title}" is ${issueRelationship.to.githubMetadata.state.toUpperCase()}\n`
            }
        })
    })

    return epicStatus
}

async function generateStatusReport() {
            
            let issues = await getIssuesForProject()

            await addEpicPropertyToIssues(issues)

            const epicIssues = issues.filter(issue => issue.isEpic === true);

            const epicStatus = await generateEpicStatus(epicIssues)
            console.log(epicStatus)

            return epicStatus
            
            /*

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