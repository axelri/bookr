var casper = require("casper").create();
var utils = require("utils");
var _ = require("lodash");

var url = 'http://bokning.lib.kth.se/bokning_po.asp?bibid=KTHB&typ=Grp';
var elems = {
  dateForm: "form#showbookings",
  selectName: "bokdag",
  selectId: "#seldate",
  table: "center + table > tbody"
};

var day = "on";
var time = "12";
var room = "12";

casper.start(url);

// select day and submit
casper.then(function() {
  var els = this.getElementsInfo(elems.selectId + " > option");
  var dayOp = _.find(els, function(e) {
    var reg = new RegExp(day+"$");
    return e.text.match(reg) !== null;
  });
  if (dayOp === undefined) {
    this.die("Can't find requested date");
  }

  var fills = {};
  fills[elems.selectName] = dayOp.attributes.value;
  this.fill(elems.dateForm, fills, true);
});

// follow link to room and time
casper.then(function() {
  var cols = this.getElementsInfo(elems.table +
      " tr:first-child > td > span");
  var colIndex = _.findIndex(cols, function(e) {
    var reg = new RegExp(time+":00 -");
    return e.text.match(reg) !== null;
  });
  if (colIndex === -1) {
    this.die("Can't find requested time");
  }
  var colChild = colIndex + 2;

  var rows = this.getElementsInfo(elems.table +
    " > tr td:first-child b:first-child");
  var rowIndex = _.findIndex(rows, function(e) {
    var reg = new RegExp("^"+room);
    return e.text.match(reg) !== null;
  });
  if (rowIndex === -1) {
    this.die("Can't find requested room");
  }
  var rowChild = rowIndex + 2;

  var button = elems.table + " tr:nth-of-type(" + rowChild + ")" +
      " td:nth-of-type(" + colChild + ") a";
  utils.dump(button);
  var available = this.exists(button);
  if (!available) {
    this.die("The room is already booked");
  }
  this.click(button);
});

casper.then(function() {
  this.echo(this.getCurrentUrl());
});

casper.run();
