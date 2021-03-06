const issuesHelpers = require('../issues')
const fs = require('fs')

describe('pruneOldIssues', () => {     
    it('should return an array with 0 issues if no issues', async () => {
        const issues = [

        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should return an array with 2 issues if 2 issues were created since the report starting date', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "created_at": "2018-11-30T00:00:00.000Z"
                }
            },
            {
                "githubMetadata": {
                    "created_at": "2018-11-30T00:00:00.000Z"
                }
            }
        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })

    it('should return an array with 2 issues if 2 issues are open and in progress', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isInProgress": "true"
            },
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isInProgress": "true"
            }
        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })

    it('should return an array with 0 issues if 0 issues are open but NOT in progress', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isInProgress": false
            },
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isInProgress": false
            }
        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should return an array with 2 issues if 2 issues are children', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isChild": true
            },
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isChild": true
            }
        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })

    it('should return an array with 2 issues if 2 issues were closed since the report starting date', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "closed_at": "2018-11-30T00:00:00.000Z"
                }
            },
            {
                "githubMetadata": {
                    "closed_at": "2018-11-30T00:00:00.000Z"
                }
            }
        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })

    it('should return an array with 4 issues if one of each case', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "created_at": "2018-11-30T00:00:00.000Z"
                }
            },
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isInProgress": true
            },
            {
                "githubMetadata": {
                    "state": "open"
                },
                "isChild": true
            },
            {
                "githubMetadata": {
                    "closed_at": "2018-11-30T00:00:00.000Z"
                }
            }
        ]
        
        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.pruneOldIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(4)
    })
})

describe('getInProgressOrphanIssues', () => {    
    it('should return issue if issue is open, in progress, not an epic, not a child, and not a pr', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-30T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: false,
                isChild: false,
                isPR: false
            }
        ]

        const result = await issuesHelpers.getInProgressOrphanIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
    })

    it('should NOT return issue if issue is closed', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "closed",
                    "updated_at": "2018-11-30T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: false,
                isChild: false,
                isPR: false
            }
        ]

        const result = await issuesHelpers.getInProgressOrphanIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should NOT return issue if issue is not in progress', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-30T00:00:00.000Z"
                },
                isInProgress: false,
                isEpic: false,
                isChild: false,
                isPR: false
            }
        ]

        const result = await issuesHelpers.getInProgressOrphanIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should NOT return issue if issue is an epic', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-30T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: true,
                isChild: false,
                isPR: false
            }
        ]

        const result = await issuesHelpers.getInProgressOrphanIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should NOT return issue if issue is a PR', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-30T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: false,
                isChild: false,
                isPR: true
            }
        ]

        const result = await issuesHelpers.getInProgressOrphanIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should sorty issues by updated date in asc order', async () => {
        const issues = [
            {
                "_id": "1",
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-15T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: false,
                isChild: false,
                isPR: false
            },
            {
                "_id": "2",
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-10T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: false,
                isChild: false,
                isPR: false
            },
            {
                "_id": "3",
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-30T00:00:00.000Z"
                },
                isInProgress: true,
                isEpic: false,
                isChild: false,
                isPR: false
            }
        ]

        const result = await issuesHelpers.getInProgressOrphanIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result[0]._id).toBe('2')
        expect(result[1]._id).toBe('1')
        expect(result[2]._id).toBe('3')
    })
})

describe('getClosedIssues', () => {  
    it('should return issue if issue is closed, was closed after the report starting date, and is not a PR', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "closed",
                    "closed_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getClosedIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
    })

    it('should not return issue if issue is open', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "open",
                    "updated_at": "2018-11-15T00:00:00.000Z",
                    "closed_at": "1970-01-01T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getClosedIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should not return issue was closed before the report starting date', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "closed",
                    "closed_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-30T00:00:00Z')

        const result = await issuesHelpers.getClosedIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should not return issue is a PR', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "state": "closed",
                    "closed_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: true
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getClosedIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should sorty issues by closed date in asc order', async () => {
        const issues = [
            {
                "_id": "1",
                "githubMetadata": {
                    "state": "closed",
                    "closed_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: false
            },
            {
                "_id": "2",
                "githubMetadata": {
                    "state": "closed",
                    "closed_at": "2018-11-12T00:00:00.000Z"
                },
                isPR: false
            },
            {
                "_id": "3",
                "githubMetadata": {
                    "state": "closed",
                    "closed_at": "2018-11-30T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getClosedIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result[0]._id).toBe('2')
        expect(result[1]._id).toBe('1')
        expect(result[2]._id).toBe('3')
    })
})

describe('getNewIssues', () => {   
    it('should return issue if issue was created after the report starting date and is not a PR', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "created_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getNewIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
    })

    it('should not return issue if issue was created before the report starting date', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "created_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-30T00:00:00Z')

        const result = await issuesHelpers.getNewIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should not return issue if issue is a PR', async () => {
        const issues = [
            {
                "githubMetadata": {
                    "created_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: true
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getNewIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should sorty issues by created date in asc order', async () => {
        const issues = [
            {
                "_id": "1",
                "githubMetadata": {
                    "state": "closed",
                    "created_at": "2018-11-15T00:00:00.000Z"
                },
                isPR: false
            },
            {
                "_id": "2",
                "githubMetadata": {
                    "state": "closed",
                    "created_at": "2018-11-12T00:00:00.000Z"
                },
                isPR: false
            },
            {
                "_id": "3",
                "githubMetadata": {
                    "state": "closed",
                    "created_at": "2018-11-30T00:00:00.000Z"
                },
                isPR: false
            }
        ]

        const reportSinceDateRaw = Date.parse('2018-11-10T00:00:00Z')

        const result = await issuesHelpers.getNewIssues(issues, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result[0]._id).toBe('2')
        expect(result[1]._id).toBe('1')
        expect(result[2]._id).toBe('3')
    })
})

describe('getEpicIssues', () => {   
    it('should return an array of 2 epics if 2 epics in progress, epics, and NOT PRs', async () => {
        const issues = [
            {
                isInProgress: true,
                isEpic: true,
                isPR: false
            },
            {
                isInProgress: true,
                isEpic: true,
                isPR: false
            },
        ]

        const result = await issuesHelpers.getEpicIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })

    it('should NOT return an epic if issue is NOT an epic', async () => {
        const issues = [
            {
                isEpic: false
            }
        ]

        const result = await issuesHelpers.getEpicIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should NOT return an epic if issue is a PR', async () => {
        const issues = [
            {
                isPR: false
            }
        ]

        const result = await issuesHelpers.getEpicIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should NOT return an epic if issue is NOT in progress', async () => {
        const issues = [
            {
                isInProgress: false
            }
        ]

        const result = await issuesHelpers.getEpicIssues(issues)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })
})
