const helpers = require('../helpers')
const fs = require('fs')

const cardsForProject = fs.readFileSync('./tests/fixtures/cardsForProject.json', 'utf8')

describe('getIssuesForProject', () => {
      
    it('should return 6 issues', async () => {
        const getIssuesForProject = jest.fn(() => JSON.parse(cardsForProject))

        const result = await getIssuesForProject()

        expect(result.length).toBe(6)
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

        const result = await helpers.checkIfEpic(issue)

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

        const result = await helpers.checkIfEpic(issue)

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

        const result = await helpers.checkIfEpic(issue)

        expect(result).toBe(false)
    })

    it('should return false if no relationships', async () => {
        const issue = {
            "relationships": [
                
            ]
        }

        const result = await helpers.checkIfEpic(issue)

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

        const result = await helpers.checkIfChild(issue)

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

        const result = await helpers.checkIfChild(issue)

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

        const result = await helpers.checkIfChild(issue)

        expect(result).toBe(false)
    })

    it('should return false if no relationships', async () => {
        const issue = {
            "relationships": [
                
            ]
        }

        const result = await helpers.checkIfChild(issue)

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

        const result = await helpers.checkIfInProgress(issue)

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

        const result = await helpers.checkIfInProgress(issue)

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

        const result = await helpers.checkIfInProgress(issue)

        expect(result).toBe(false)
    })
})
