# 📆 Waffle Weekly

A report of weekly progress for Waffle.io projects (boards).

## Overview

Some Waffle.io users need to share status with stakeholders outside of the team members who use a Waffle.io project on a daily basis.  These stakeholders might be leadership, clients, or other teams who aren't reviewing the Waffle.io project on a frequent basis or don't have access to GitHub (and therefore don't have access to Waffle.io).  While you can [view issues closed in the past 30 days](https://help.waffle.io/faq/done-column-closing-issues/can-i-viewed-my-archived-issues) on Waffle.io's Throughput report, it doesn't provide context about epics, new issues, etc.  

Waffle Weekly is a project to explore possible future functionality to provide additional progress reporting for Waffle.io projects.

## Roadmap

Potential future additions:

* HTML formatting
* Ability to select a Waffle board for the report.
* Ability to manage the Waffle.io API key used for the report. 
* Ability to setup a recurring Waffle Weekly to be send via email.
* Ability to setup email delivery on a daily, weekly, and/or monthly basis.
* Ability to manage email recipients to recieve the report.
* Additional metadata (assingees, column, labels, etc).

## How It Works

Queries the Waffle.io API for status of GitHub project(s) included in the Waffle.io project (board).

## Usage

1. Clone this repo locally.
2. Contact support@waffle.io to obtain a Waffle.io API Key.
3. Create a `dev` file in the root of this project with the following contents and update with the Waffle.io API Key:
```
export waffleApiSecret='12345'
export waffleProjectId='12345'

node app.js
```
4. Run `npm install` to install dependencies.
5. Run `npm start` to install dependencies.
6. Open `http://localhost:3000/` in a web browser.

### Development

Run `nodemon --exec "bash dev"` to restart the project when changes are made.

## Examples

```
Waffle.io Progress Report
for adamzolyak/test-letswafflebot

EPICS

   EPIC:Epic: another epic

      OPEN ISSUES in EPIC
         * "child 3" is OPEN

      CLOSED ISSUES in EPIC
         * "child 1" is CLOSED
         * "child 2" is CLOSED

ISSUES (without parents)

   NEW ISSUES
     * "child 3" is OPEN
     * "this is child B" is OPEN

   CLOSED ISSUES
     * "this is child A" is CLOSED
     * "child 1" is CLOSED
     * "child 2" is CLOSED
```

## Resources

Waffle.io API Docs
https://docs.waffle.io/

## License

[ISC](LICENSE) © 2018 Waffle.io <team@waffle.io> (www.waffle.io)
