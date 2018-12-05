const _ = require('lodash')
const moment = require('moment')
const axios = require('axios')
const issueHelpers = require('./issue')

let ghApiCount = 0

module.exports.printGHApiCountUsed = function() {
    console.log('GH API Count: ' + ghApiCount)
}

module.exports.getGHApiRateLimitRemaining = async function() {
    const url = 'https://api.github.com/rate_limit'

    return await ghAPI.get(url)
        .then(response => {
            console.log(`GH API Remaining Calls: ${response.data.rate.remaining}`)

            const timeNow = Date.parse(moment()) / 1000
            const timeReset = response.data.rate.reset
            console.log(`GH API Seconds to Reset: ${timeReset - timeNow}`)
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}

const ghAPI = axios.create({
    timeout: 10000,
    headers: {'Authorization': 'token ' + process.env.ghApiToken}
})

module.exports.getIssueDetail = async function(url) {
    ghApiCount ++
    
    return await ghAPI.get(url)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}

module.exports.getIssueEventsDetail = async function(url) {
    ghApiCount ++

    return await ghAPI.get(url)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}


module.exports.getIssueCommentsDetail = async function(url) {
    ghApiCount ++
    
    return await ghAPI.get(url)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(`${error.message}(${url})`)
        })
}

module.exports.pruneOldIssues = function(issues, reportSinceDateRaw) {       
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw || Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw || issue.githubMetadata.state === 'open')
    issueSubset = issueSubset.filter(issue => {
        if(issue.isChild == true) {
            return true
        }else if(issue.githubMetadata.state === 'open') {
            if(issue.isInProgress) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    })
 
    return issueSubset
}

module.exports.getInProgressOrphanIssues = function(issues) {
    let issueSubset = issues.filter(issue => issue.githubMetadata.state === 'open')
    issueSubset = issueSubset.filter(issue => issue.isInProgress === true)
    issueSubset = issueSubset.filter(issue => issue.isEpic === false)
    issueSubset = issueSubset.filter(issue => issue.isChild === false)
    issueSubset = issueSubset.filter(issue => issue.isPR === false)
    
    issueSubset = _.orderBy(issueSubset, ['githubMetadata.updated_at'], ['asc'])

    return issueSubset 
}

module.exports.getClosedIssues = function(issues, reportSinceDateRaw) {
    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.closed_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.githubMetadata.state === 'closed')
    issueSubset = issueSubset.filter(issue => issue.isPR === false)

    issueSubset = _.orderBy(issueSubset, ['githubMetadata.closed_at'], ['asc'])

    return issueSubset 
}

module.exports.getNewIssues = function(issues, reportSinceDateRaw) {

    let issueSubset = issues.filter(issue => Date.parse(issue.githubMetadata.created_at) > reportSinceDateRaw)
    issueSubset = issueSubset.filter(issue => issue.isPR === false)

    issueSubset = _.orderBy(issueSubset, ['githubMetadata.state', 'githubMetadata.created_at'], ['desc', 'asc'])

    return issueSubset 
}

module.exports.getEpicIssues = function(issues) {
    let issueSubset = issues.filter(issue => issue.isEpic === true)
    issueSubset = issueSubset.filter(issue => issue.isInProgress === true)
    issueSubset = issueSubset.filter(issue => issue.isPR === false)

    return issueSubset 
}
