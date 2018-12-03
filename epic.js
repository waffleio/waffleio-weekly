// code that may be reuseable if reimplementing epic reporting which was removed for v1

async function getEpicIssues(issues) {
    let issueSubset = issues.filter(issue => issue.isEpic === true)
    issueSubset = issueSubset.filter(issue => issue.isInProgress === true)
    issueSubset = issueSubset.filter(issue => issue.isPR === false)

    return issueSubset 
}

