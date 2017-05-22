/*!
 * BoardSnapshot
 * https://github.com/wadewachs/boardsnap
 * 
 * Credit:
 * started from https://github.com/llad/export-for-trello
 *
 */


var $;

var $list_snapshot_btn,
	$board_snapshot_btn,
    addInterval,
	listCard;


var createSnapshot = function() {
	authorize();
	var boardId = window.location.pathname.substr(3,8);
    Trello.boards.get(boardId,{lists:"all", cards:"visible", card_fields:"url,name,idList,pos", fields:"name", list_fields:"name,closed,pos"}, function(board) {
		for (var i=0; i<board.lists.length; i++) {
			if (board.lists[i].name == "Board Snapshots") {
				var snapshotList = board.lists[i].id;
			}
		};
		if(!snapshotList) {
			Trello.post("lists", {name:"Board Snapshots", idBoard:board.id, pos:"bottom"}, createSnapshot);
			return;
		}
		var d = Date();
		
		Trello.post("lists/"+snapshotList+"/cards",{name:Date()}, function(results) {
			var listNames = [];
			for (var i=0; i<board.lists.length; i++) {
				listNames[board.lists[i].id] = board.lists[i].name;
			}
			for (var i=0; i<board.lists.length; i++) {
				if (board.lists[i].closed == false && board.lists[i].name != 'Board Snapshots') {
					Trello.post("checklists", {idCard:results.id, name:board.lists[i].id, pos:board.lists[i].pos}, function(results) {
						for (var i=0; i<board.cards.length; i++) {
							if (board.cards[i].idList == results.name) {
								Trello.post("checklists/"+results.id+"/checkitems", {name:board.cards[i].url, pos:board.cards[i].pos}, function () {});
							}
						};
						Trello.put("checklists/"+results.id+"/name", {value:listNames[results.name]}, function () {}, function () {alert("Failed to rename checklist!")});
					});
				}
			}
		});
	});
}




// Add a Board Snapshot button to the DOM and trigger export if clicked
function addSnapshotLink() {
	"use strict";
	//alert('add');
   
	var $js_btn = $('a.js-copy-board'); // Export JSON link
    
	// See if our link is already there
	if ($('.board-menu-navigation').find('.js-board-snapshot').length) {
		clearInterval(addInterval);
		return;
	}
    
    // The new link/button
	var $li_wrap = document.createElement("li");
	$li_wrap.className = 'board-menu-navigation-item';
	
	if ($js_btn.length) {
		$board_snapshot_btn = $('<a>')
			.attr({
				'class': 'board-menu-navigation-item-link js-board-snapshot nav-list-item nav-list-sub-item',
				'href': '#',
				'target': '_blank',
				'title': 'Create a snapshot card of the board'
			})
			.text(' Board Snapshot')
			.click(createSnapshot)
			.insertAfter($js_btn.parent())
			.prepend('<span class="icon-sm icon-card-cover board-menu-navigation-item-link-icon"></span>')
			.wrap($li_wrap);
    
	}
}

function listSnapshot () {
	if (!listCard) {
		alert("There are no cards in this list.");
		return;
	}
	authorize();
	var cardId = listCard.substr(3,8);

	Trello.get("cards/" + cardId, {fields:"name", list:"true"}, function (results) {
		var listName = results.list.name;
		var listId = results.list.id;
		Trello.get("lists/" + listId, {cards:"open", card_fields:"url,pos"}, function(results) {
			var cards = results.cards;
			Trello.post("cards/", {name:listName + " - Snapshot " + Date().toString().substr(4,21), pos:"top", idList:listId, urlSource:null}, function (results) {
				Trello.post("checklists/", {name:listName, idCard:results.id, pos:"top"}, function (results) {
					var checklist = results.id;
					for (var i=0; i<cards.length; i++) {
//						ddconsole.log("Add " + cards[i].url + " the the list");
						Trello.post("checklists/" + checklist + "/checkItems", {name:cards[i].url, pos:cards[i].pos}, function(results) {

						});
					}
				});
			});
		});
	});
	

}


function addListSnapshotLink() {


	"use strict";
	var $js_btn = $('a.js-list-subscribe'); // List Actions > Subscribe link
    
	// See if our link is already there
	if ($('.pop-over-list').find('.js-list-snapshot').length) {
		clearInterval(addInterval);
		return;
	}
    
    // The new link/button
	if ($js_btn.length) {
	
		$list_snapshot_btn = $('<a>')
			.attr({
				'class': 'js-list-snapshot',
				'href': '#',
				'target': '_blank',
				'title': 'Create a snapshot card of this list'
			})
			.text('Create List Snapshot')
			.click(listSnapshot)
			.insertAfter($js_btn.parent())
			.wrap(document.createElement("li"));
	}
}




var authorize = function () {
	Trello.authorize({
		interactive:false,
		error: function () {  Trello.authorize({
			interactive:true,
			name: "Board Snapshot",
			scope: {read: true, write: true, account: false},
			expiration: "never",
			type: "popup",
			success: createSnapshot
		})}
	});
}

// on DOM load
$(function () {
    "use strict";
    // Look for clicks on the .js-toggle-widget-nav class, which is
    // the "Menu" link on the board header option list
    $(document).on('mouseup', ".js-show-sidebar", function () {
        addInterval = setInterval(addSnapshotLink, 50);
    });

    $(document).on('mouseup', ".list-header-extras", function () {
		listCard = $(this).parent().next().children("div:nth-child(1)").children("div.list-card-details").children("a.list-card-title").attr('href');
        addInterval = setInterval(addListSnapshotLink, 50);
    });

});
