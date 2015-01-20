var utils = require("utils");
var _ = require("lodash");
var bookings = require("./bookings.json");

var url = 'http://bokning.lib.kth.se/bokning_po.asp?bibid=KTHB&typ=Grp';
var elems = {
  dateForm: "form#showbookings",
  selectName: "bokdag",
  selectId: "#seldate",
  table: "center + table > tbody",
  bookForm: 'form[action="bokaupd_po.asp"]'
};

var finished = 0;

_.forEach(bookings, function(b) {

  var casper = require('casper').create();
  var fail = false;
  var failReason = "";
  casper.start(url);
  casper.then(function() {
    if (fail) {return;}

    var els = this.getElementsInfo(elems.selectId + " > option");
    var dayOp = _.find(els, function(e) {
      var reg = new RegExp(b.day+"$");
      return e.text.match(reg) !== null;
    });
    if (dayOp === undefined) {
      failReason = "Can't find requested date";
      fail = true;
      return;
    }

    var fills = {};
    fills[elems.selectName] = dayOp.attributes.value;
    this.fill(elems.dateForm, fills, true);
  });

  casper.then(function() {
    if (fail) {return;}

    // follow link to room and time
    var cols = this.getElementsInfo(elems.table +
        " tr:first-child > td > span");
    var colIndex = _.findIndex(cols, function(e) {
      var reg = new RegExp(b.time+":00 -");
      return e.text.match(reg) !== null;
    });
    if (colIndex === -1) {
      failReason = "Can't find requested time";
      fail = true;
      return;
    }
    var colChild = colIndex + 2;

    var rows = this.getElementsInfo(elems.table +
      " > tr td:first-child b:first-child");
    var rowIndex = _.findIndex(rows, function(e) {
      var reg = new RegExp("^"+b.room);
      return e.text.match(reg) !== null;
    });
    if (rowIndex === -1) {
      failReason = ("Can't find requested room");
      fail = true;
      return;
    }
    var rowChild = rowIndex + 2;

    var button = elems.table + " tr:nth-of-type(" + rowChild + ")" +
        " td:nth-of-type(" + colChild + ") a";
    var available = this.exists(button);
    if (!available) {
      failReason = "The room is already booked";
      fail = true;
      return;
    }
    this.click(button);
  });

  casper.then(function() {
    if (fail) {return;}

    this.fill(elems.bookForm, {
      loan: b.card,
      anv: b.name
    }, true);
  });

  casper.then(function() {
    if (fail) {return;}

    var error = "p > span";
    if (this.exists(error)) {
      var el = this.getElementInfo(error);
      if (el.text.match(new RegExp("Felaktigt"))) {
        failReason = "Invalid card number";
        fail = true;
        return;
      }
    }
  });

  casper.run(function() {
    utils.dump(b);
    if (!fail) {
      this.echo("Successful booking");
    } else {
      this.echo("Booking error: " + failReason);
    }
    finished += 1;
    if (finished >= bookings.length) {
      this.exit();
    }
  });
});
