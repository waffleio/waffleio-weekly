const issueHelpers = require('../issue')
const fs = require('fs')

const cardsForProject = fs.readFileSync('./tests/fixtures/cardsForProject.json', 'utf8')

describe('getIssuesForProject', () => {
      
    it('should return 9 issues', async () => {
        const getIssuesForProject = jest.fn(() => JSON.parse(cardsForProject))

        const result = await getIssuesForProject()

        expect(result.length).toBe(9)
    })
})

describe('checkIfEpic', () => {
      
    it('should return true if one relationship is a parent', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "parent"
                }
            ]
        }

        const result = await issueHelpers.checkIfEpic(issue)

        expect(result).toBe(true)
    })
      
    it('should return false if one relationship is a child', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "child"
                }
            ]
        }

        const result = await issueHelpers.checkIfEpic(issue)

        expect(result).toBe(false)
    })

    it('should return false if no relationship is a parent or child', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "close"
                }
            ]
        }

        const result = await issueHelpers.checkIfEpic(issue)

        expect(result).toBe(false)
    })

    it('should return false if no relationships', async () => {
        const issue = {
            "relationships": [
                
            ]
        }

        const result = await issueHelpers.checkIfEpic(issue)

        expect(result).toBe(false)
    })
})

describe('checkIfChild', () => {
      
    it('should return true if one relationship is a child', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "child"
                }
            ]
        }

        const result = await issueHelpers.checkIfChild(issue)

        expect(result).toBe(true)
    })
      
    it('should return false if one relationship is a parent', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "parent"
                }
            ]
        }

        const result = await issueHelpers.checkIfChild(issue)

        expect(result).toBe(false)
    })

    it('should return false if no relationship is a parent or child', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "close"
                }
            ]
        }

        const result = await issueHelpers.checkIfChild(issue)

        expect(result).toBe(false)
    })

    it('should return false if no relationships', async () => {
        const issue = {
            "relationships": [
                
            ]
        }

        const result = await issueHelpers.checkIfChild(issue)

        expect(result).toBe(false)
    })
})

describe('checkIfPR', () => {
    it('should return true if has pull request', async () => {
        const issue =  {
            "githubMetadata": {
                "pull_request": {
                    "html_url": "https://github.com/adamzolyak/test-data/pull/9"
                }
            }
        }

        const result = await issueHelpers.checkIfPR(issue)

        expect(result).toBe(true)
    })

    it('should return true if does NOT have pull request', async () => {
        const issue =  {
            "githubMetadata": {

            }
        }

        const result = await issueHelpers.checkIfPR(issue)

        expect(result).toBe(false)
    })
})


describe('checkIfInProgress', () => {
      
    it('should return true if has in progress label - single label', async () => {
        const issue =  {
            "githubMetadata": {
                "labels": [
                    {
                        "name": "waffle:in progress"
                    }
                ]
            }
        }

        const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

        const result = await issueHelpers.checkIfInProgress(issue, inProgressLabels)

        expect(result).toBe(true)
    })

    it('should return true if has in progress label - multiple labels', async () => {
        const issue =  {
            "githubMetadata": {
                "labels": [
                    {
                        "name": "waffle:in progress"
                    },
                    {
                        "name": "bug"
                    }
                ]
            }
        }

        const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

        const result = await issueHelpers.checkIfInProgress(issue, inProgressLabels)

        expect(result).toBe(true)
    })

    it('should return false if does not have in progress label', async () => {
        const issue =  {
            "githubMetadata": {
                "labels": [
                    {
                        "name": "bug"
                    }
                ]
            }
        }

        const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

        const result = await issueHelpers.checkIfInProgress(issue, inProgressLabels)

        expect(result).toBe(false)
    })
})

describe('getInProgressLabel', () => {
    it('should return in progress label if issue label is in progress labels', async () => {
        const issue =  {
            "githubMetadata": {
                "labels": [
                    {
                        "name": "waffle:in progress"
                    }
                ]
            }
        }

        const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

        const result = await issueHelpers.getInProgressLabel(issue, inProgressLabels)

        expect(result).toBe('waffle:in progress')
    })

    it('should return null if issue label is NOT in progress labels', async () => {
        const issue =  {
            "githubMetadata": {
                "labels": [
                    {
                        "name": "bug"
                    }
                ]
            }
        }

        const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

        const result = await issueHelpers.getInProgressLabel(issue, inProgressLabels)

        expect(result).toBe(null)
    })

    it('should return the 2nd in progress label if 2 issue label is in progress labels', async () => {
        const issue =  {
            "githubMetadata": {
                "labels": [
                    {
                        "name": "waffle:in progress"
                    },
                    {
                        "name": "waffle:needs review"
                    }
                ]
            }
        }

        const inProgressLabels = ['waffle:in progress', 'waffle:needs review']

        const result = await issueHelpers.getInProgressLabel(issue, inProgressLabels)

        expect(result).toBe('waffle:needs review')
    })
})

describe('getEpics', () => {
    it('should return an array of 0 epics if issue has 0 epic relationships', async () => {
        const relationships =  [
                {
                    "relationship": "parent"
                }
            ]

        const result = await issueHelpers.getEpics(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })
    
    it('should return an array of 1 epic if issue has 1 epic relationship', async () => {
        const relationships =  [
                {
                    "relationship": "child"
                }
            ]

        const result = await issueHelpers.getEpics(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
    })

    it('should return an array of 2 epics if issue has 2 epic relationships', async () => {
        const relationships =  [
                {
                    "relationship": "child"
                },
                {
                    "relationship": "child"
                }
            ]

        const result = await issueHelpers.getEpics(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })
})

describe('getNewComments', () => {
    it('should return an array of 1 comments if issue has 1 comments after filter date', async () => {
        const comments = [
            {
              "created_at": "2011-04-14T16:00:49Z"
            },
            {
              "created_at": "2011-04-10T16:00:49Z"
            }
          ]

        const reportSinceDateRaw = Date.parse('2011-04-14T16:00:49Z') - 1000

        const result = await issueHelpers.getNewComments(comments, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
    })

    it('should return an array of 0 comments if issue has 1 comments before filter date', async () => {
        const comments = [
            {
                "created_at": "2011-04-10T16:00:49Z"
              },
              {
                "created_at": "2011-04-10T16:00:49Z"
              }
          ]

        const reportSinceDateRaw = Date.parse('2011-04-14T16:00:49Z') - 1000

        const result = await issueHelpers.getNewComments(comments, reportSinceDateRaw)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })
})

describe('getPRs', () => {
    it('should return an array of 0 PRs if issue has 0 PRs relationships', async () => {
        const relationships =  [
                {
                    "relationship": "child"
                }
            ]

        const result = await issueHelpers.getPRs(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(0)
    })

    it('should return an array of 2 PRs if issue has 2 PRs relationships of type closedBy', async () => {
        const relationships =  [
                {
                    "relationship": "closedBy"
                },
                {
                    "relationship": "closedBy"
                }
            ]

        const result = await issueHelpers.getPRs(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })

    it('should return an array of 1 PRs if issue has 1 PRs relationships of type connectedFrom', async () => {
        const relationships =  [
                {
                    "relationship": "connectedFrom"
                }
            ]

        const result = await issueHelpers.getPRs(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(1)
    })

    it('should return an array of 2 PRs if issue has 2 PRs relationships - one of of type closedBy and one of type connectedFrom', async () => {
        const relationships =  [
                {
                    "relationship": "closedBy"
                },
                {
                    "relationship": "connectedFrom"
                }
            ]

        const result = await issueHelpers.getPRs(relationships)

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })
})

describe('getAssignees', () => {
    it('should return an empty string if issue has 0 assignees', async () => {
        const assignees = [
           
        ]

        const result = await issueHelpers.getAssignees(assignees)

        expect(typeof result).toBe('string')
        expect(result).toBe('')
    })

    it('should return an string of 1 assignees if issue has 1 assignees', async () => {
        const assignees = [
                    {
                        "login": "adam"
                    }
                ]

        const result = await issueHelpers.getAssignees(assignees)

        expect(typeof result).toBe('string')
        expect(result).toBe('adam')
    })

    it('should return an string of 3 assignees if issue has 3 assignees', async () => {
        const assignees = [
                    {
                        "login": "adam"
                    },
                    {
                        "login": "mary"
                    },
                    {
                        "login": "bex"
                    }
                ]

        const result = await issueHelpers.getAssignees(assignees)

        expect(typeof result).toBe('string')
        expect(result).toBe('adam, mary, bex')
    })
})

describe('getDaysInState', () => {
    it('return null if there is no labeled event with the current state label', async () => {
        const events = [
            
        ]

        const currentState = 'waffle:in progress'

        const todaysDateRaw = Date.parse('2018-11-18T01:00:00Z')

        const result = await issueHelpers.getDaysInState(events, currentState, todaysDateRaw)

        expect(result).toBe(null)
    })

    it('return 3 if there have been 3.0 days since the latest current state label was applied', async () => {
        const events = [
            {
                "event": "labeled",
                "created_at": "2018-11-15T00:00:00Z",
                "label": {
                    "name": "waffle:in progress"
                }
            }
        ]

        const currentState = 'waffle:in progress'

        const todaysDateRaw = Date.parse('2018-11-18T00:00:00Z')

        const result = await issueHelpers.getDaysInState(events, currentState, todaysDateRaw)

        expect(result).toBe(3)
    })

    it('return 4 if there have been 3.75 days since the latest current state label was applied', async () => {
        const events = [
            {
                "event": "labeled",
                "created_at": "2018-11-15T00:00:00Z",
                "label": {
                    "name": "waffle:in progress"
                }
            }
        ]

        const currentState = 'waffle:in progress'

        const todaysDateRaw = Date.parse('2018-11-18T18:00:00Z')

        const result = await issueHelpers.getDaysInState(events, currentState, todaysDateRaw)

        expect(result).toBe(4)
    })

    it('use the latest current state label if there are multiple labeled events', async () => {
        const events = [
            {
                "event": "labeled",
                "created_at": "2018-11-13T00:00:00Z",
                "label": {
                    "name": "waffle:in progress"
                }
            },
            {
                "event": "labeled",
                "created_at": "2018-11-15T00:00:00Z",
                "label": {
                    "name": "waffle:in progress"
                }
            }
        ]

        const currentState = 'waffle:in progress'

        const todaysDateRaw = Date.parse('2018-11-18T00:00:00Z')

        const result = await issueHelpers.getDaysInState(events, currentState, todaysDateRaw)

        expect(result).toBe(3)
    })
})
