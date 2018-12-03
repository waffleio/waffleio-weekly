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

module.exports.checkIfPR = function(issue) {
    let isPR = false
    
    if(issue.githubMetadata.pull_request) {
        isPR = true
    }

    return isPR
}

module.exports.checkIfInProgress = function(issue) {
    
    let isInProgress = false

    if(issue.githubMetadata.labels) {
        isInProgress = issue.githubMetadata.labels.some(label => {
            if (label.name === 'waffle:in progress' || label.name === 'waffle:needs review') {
                return true
            } 
        })
    }

    return isInProgress
}

module.exports.checkIfHasPR = function(issue) {
    let hasPR = false
    
    if(issue.relationships) {
        hasPR = issue.relationships.some(issueRelationship => {
            if (issueRelationship.relationship === 'close' || issueRelationship.relationship === 'connectedFrom') {
                return true
            }
        })
    }

    return hasPR
}

module.exports.getNewComments = function(comments, reportSinceDateRaw) {
    let commentSubset = comments.filter(comment => Date.parse(comment.created_at) > reportSinceDateRaw)
    return commentSubset
}

module.exports.getPRs = function(relationships) {
    let relationshipSubset = relationships.filter(relationship => relationship.relationship === 'close' || relationship.relationship === 'connectedFrom')
    return relationshipSubset
}