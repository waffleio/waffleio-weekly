const _ = require('lodash')
const axios = require('axios')
const moment = require('moment')

module.exports.checkIfEpic = function(issue) { 
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

module.exports.checkIfChild = function(issue) {
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

module.exports.getEpics = function(relationships) {
    let relationshipSubset = relationships.filter(relationship => relationship.relationship === 'child')
    return relationshipSubset
}

module.exports.checkIfPR = function(issue) {
    let isPR = false
    
    if(issue.githubMetadata.pull_request) {
        isPR = true
    }

    return isPR
}

module.exports.checkIfInProgress = function(issue, inProgressLabels) {
    
    let isInProgress = false

    if(issue.githubMetadata.labels) {
        isInProgress = issue.githubMetadata.labels.some(label => {
            for (let inProgressLabel of inProgressLabels) {
                if (label.name === inProgressLabel) {
                    return true
                } 
            }
        })
    }

    return isInProgress
}

module.exports.getInProgressLabel = function(issue, inProgressLabels) {
    
    let inProgressLabel = null

    if(issue.githubMetadata.labels) {    
        for (let label of issue.githubMetadata.labels) {
            for (let inProgLabel of inProgressLabels) {
                if (label.name === inProgLabel) {
                    inProgressLabel = label.name
                } 
            }
            
        }
    }
    
    return inProgressLabel
}

module.exports.getNewComments = function(comments, reportSinceDateRaw) {
    let commentSubset = comments.filter(comment => Date.parse(comment.created_at) > reportSinceDateRaw)
    return commentSubset
}

module.exports.getPRs = function(relationships) {
    let relationshipSubset = relationships.filter(relationship => relationship.relationship === 'closedBy' || relationship.relationship === 'connectedFrom')
    return relationshipSubset
}

module.exports.getAssignees = function(assignees) {
    let issueAssignees = assignees.map(function(assignee) {
        return assignee.login
    })

    return issueAssignees.join(', ')
}

module.exports.getDaysInState = function(events, currentState) {
    let daysSinceLastInState
    let eventsSubset = events.filter(event => event.event === 'labeled' && event.label.name === currentState)
    eventsSubset = _.orderBy(eventsSubset, ['created_at'], ['desc'])

    if (eventsSubset.length >= 1) {
        labelAppliedDate = Date.parse(eventsSubset[0].created_at)
        todaysDateRaw = moment()
        daysSinceLastInState = (todaysDateRaw - labelAppliedDate) / 1000 / 60 / 60 / 24
        daysSinceLastInState = Math.round(daysSinceLastInState)
    } else {
        daysSinceLastInState = null
    }

    return daysSinceLastInState
}
