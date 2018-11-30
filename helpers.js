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

