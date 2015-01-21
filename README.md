# bookr
A small booking script for kthb. Pair it with ``cron`` and stay ahead of the crowd.

## Installation
Install [node](http://nodejs.org/), [phantomJS](http://phantomjs.org/) and [casperJS](http://casperjs.org/) for your platform.
Then ``cd`` to the bookr diretory and install the required node modules with ``npm install``.

## Usage
Simply call the script like so ``./bookr <jobs.json>``, which is equivalent to ``casperjs ./bookrjs <jobs.json>``.

## Jobs file
The jobs file format is subject to change, so please stay updated by examining the examples. At the time of writing it's a simple
json file, containing an array of job objects with the following format:

| Property      | Description   | Allowed values|
| ------------- |---------------| ------|
| ``day``       | Weekday | må,ti,on,to,fr,lö (string) |
| ``time``      | Begin time      | 8,10,12,15,18 (string) |
| ``room`` | Room number     | 0-13 (string) |
| ``name`` | Name of booker     | Any string |
| ``card`` |Library card number     | Any string |
