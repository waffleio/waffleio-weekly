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
    it('do something', async () => {
        expect(true).toBe(false)
    })
})

describe('getPRs', () => {
    it('do something', async () => {
        expect(true).toBe(false)
    })
})

describe('getAssignees', () => {
    it('do something', async () => {
        expect(true).toBe(false)
    })
})

describe('getDaysInState', () => {
    it('do something', async () => {
        expect(true).toBe(false)
    })
})
