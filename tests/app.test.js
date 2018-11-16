const app = require('../app')
const fs = require('fs')

const cardsForProject = fs.readFileSync('./tests/fixtures/cardsForProject.json', 'utf8')

describe('getIssuesForProject', () => {
      
    it('should return 6 issues', async () => {
        const getIssuesForProject = jest.fn(() => JSON.parse(cardsForProject))

        const result = await getIssuesForProject()

        expect(result.length).toBe(6)
    })
})

describe('isEpic', () => {
      
    it('should return true if issue has 1 parent relationship', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "parent"
                }
            ]
        }

        const result = app.isEpic(issue)

        expect(result).toBe(true)
    })

    it('should return true if issue has multiple parent relationships', async () => {
        const issue = {
            "relationships": [
                {
                    "relationship": "parent"
                },
                {
                    "relationship": "parent"
                },
                {
                    "relationship": "parent"
                }
            ]
        }

        const result = app.isEpic(issue)

        expect(result).toBe(true)
    })

    it('should return false if issue has no relationships', async () => {
        const issue = {
            "relationships": []
        }

        const result = app.isEpic(issue)

        expect(result).toBe(false)
    })
})

describe('ornamentIssues', () => {
      
    it('should return 6 issues', async () => {
        const getIssuesForProject = jest.fn(() => JSON.parse(cardsForProject))

        const issues = await getIssuesForProject()

        // call ornamentIssues for each issue
        // inspect isEpic, isEpicInProgress, isChild
    })
})