var utils = require("utils");
var _ = require("lodash");

var url = 'http://bokning.lib.kth.se/bokning_po.asp?bibid=KTHB&typ=Grp';
var elems = {
  dateForm: "form#showbookings",
  selectName: "bokdag",
  selectId: "#seldate",
  table: "center + table > tbody",
  bookForm: 'form[action="bokaupd_po.asp"]'
};

var casperProc = require("casper").create();
var bookings = require(casperProc.cli.args[0]);
if(casperProc.cli.args.length < 1) {
  casperProc.die("Missing jobs file");
}

var finished = 0;
var keys = ["day", "time", "room", "name", "card"];
_.forEach(bookings, function(b) {

  var fail = false;
  var failReason = "";

  _.every(keys, function(k) {
    if (!b.hasOwnProperty(k)) {
      fail = true;
      failReason = "Missing key: " + k;
      return false;
    }
    return true;
  });

  if (fail) {
      console.log("Booking error: " + failReason);
      finished += 1;
      return;
  }

  var casper = require('casper').create();
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
        " td:nth-of-type(" + colChild + ") > a";
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
    var invalidCard = new RegExp("Felaktigt Bibliotekskortsnummer");
    var used = new RegExp("Du får endast boka 1 pass per dag" +
                          " och 2 pass per vecka");
    if (this.exists(error)) {
      var el = this.getElementInfo(error);
      if (el.text.match(invalidCard)) {
        fail = true;
        failReason = "Invalid card number";
        return;
      } else if (el.text.match(used)) {
        fail = true;
        failReason = "Card already used";
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

if (finished >= bookings.length) {
  casperProc.exit();
}
