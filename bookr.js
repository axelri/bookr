var casper = require("casper").create();
var utils = require("utils");
var _ = require("lodash");

var url = 'http://bokning.lib.kth.se/bokning_po.asp?bibid=KTHB&typ=Grp';
var elems = {
  dateForm: "form#showbookings",
  selectName: "bokdag",
  selectId: "#seldate"
};
var day = "on";
var time = "13";
var room = "12";

casper.start(url, function() {
  this.echo(this.getTitle());
});

casper.then(function() {
  var els = this.getElementsInfo(elems.selectId + " > option");
  var dayOp = _.find(els, function(e) {
    return e.text.match(new RegExp(day+"$")) !== null;
  });
  if (dayOp === undefined) {
    this.die("Can't find requested date");
  }

  var fills = {};
  fills[elems.selectName] = dayOp.attributes.value;
  this.fill(elems.dateForm, fills, true);
});

casper.then(function() {
  this.echo(this.getCurrentUrl());
});

casper.run();
