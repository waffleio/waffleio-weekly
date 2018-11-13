const axios = require('axios')
const moment = require('moment');

axios.defaults.headers.common['Authorization'] = 'bearer ' + process.env.waffleApiSecret

const waffleUserProjectsURL = `https://api.waffle.io/projects/5be5aab3b10da50134293eea/cards`

const todaysDate = moment().format('YYYY-MM-DD')
console.log("Today's date is: " + todaysDate)

const todaysDateRaw = moment()
console.log("Today's date is: " + todaysDateRaw)

const http = require('http')

const server = http.createServer((req, res) => {
    if (req.url === '/') {

        axios.get(waffleUserProjectsURL)
        .then(response => {
            
            let issues = response.data

            let openIssues = issues.filter(issue => Date.parse(issue.githubMetadata.closed_at) > (todaysDateRaw - 60480000))
            console.log(openIssues)

            let openIssuesHTML = ''

            openIssues.forEach(issue => {
                console.log(issue.githubMetadata.title)

                openIssuesHTML += issue.githubMetadata.title + ', '

                const issueDateClosed = Date.parse(issue.githubMetadata.closed_at)

                console.log(todaysDateRaw - Date.parse(issue.githubMetadata.closed_at))
            });

            res.write(openIssuesHTML)
            res.end()
        })
        .catch(error => {
          console.log(error);
          console.log("break 2")
        });
    } else {
        res.write('not found')
        res.end()
    }
})

server.listen(3000)
console.log('listening on port 3000...')