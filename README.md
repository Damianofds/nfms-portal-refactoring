# nfms-portal-refactoring

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* Python

## Installation

* `git clone https://github.com/slms4redd/nfms-portal-refactoring.git`
* `cd nfms-portal-refactoring`
* `npm install -g typescript`
* `npm install -g tsd`
* `tsd install`

## Running / Development

* `webpack --progress --colors --watch`

You will get some TypeScript compile error but it's normal at this stage, the JavaScript bundle will be generated anyway.

On another terminal window:
* `cd nfms-portal-refactoring`
* `python -m SimpleHTTPServer`

On the broser window:
* http://localhost:8000
