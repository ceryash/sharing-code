'use strict';


google.load("swfobject", "2.1");  

/* Directives */
angular.module('learner-directives').directive('rrhVideo', function($compile){
    return {
      restrict: 'A',
      // This HTML will replace the rrh-video directive.
      replace: true,
      transclude: true,
      scope: { 
    	  videoItem:"=",
    	  onTransport:"=",
    	  location:'=locateTo'
      },
      template: '<div style="text-align:center; padding:10px 150px 10px 150px;background-color:black;"></div>',
      // The linking function will add behavior to the template
      link: function postLink(scope, element, attrs) {
            // Title element
    	// observe changes to interpolated attribute
    	  scope.$watch('videoItem', function(videoItem) {
    		  // remove any current video element
    		  element.empty();
    		  var videoDirectiveElement;
    		  
    		  if(_.isUndefined(videoItem)){
    			  return;
    		  }
    		  
    		  if(videoItem.sourceUrl.indexOf('vimeo')!=-1){
    	    	  element.css("height","340px");
    	    	  videoDirectiveElement = '<div rrh-video-vimeo video-item="basketItemViewState.basketItem" locate-to="basketItemViewState.lastLocation" on-transport="onTransport"></div>';
    		  }
    		  else if(videoItem.sourceUrl.indexOf('youtube')!=-1){
    			  
    	    	  element.css("height","360px");
    	    	  videoDirectiveElement = '<div rrh-video-youtube video-item="basketItemViewState.basketItem" locate-to="basketItemViewState.lastLocation" on-transport="onTransport"></div>';
    		  }
    		  
    		  var directive = $compile(videoDirectiveElement)(scope);
    		  element.append(directive);
	        
    	  });
      }
    }
  })
  .service('Youtube',function($window){
	  // playeIndex used to distinguish player as they are created
	  var playerIndex=0,
	  
	  // hold client information about each player
	  players=[];
	  
	  //swfobject calls global onYouTubePlayerReady when players are loaded
	  $window.onYouTubePlayerReady=function(playerApiId) {

		  // use the playid to get the associated player client attributes
		  var elementPlayerId = players[playerApiId].id
		  var player = document.getElementById(elementPlayerId);
		  
		  // each player has its own unique state change global handler
		  var playerStateChangeCallbackName = 'onYoutubePlayerStateChange'+playerIndex;
		  $window[playerStateChangeCallbackName]= function(event){
			  
			  // call the clients state chnge callback if there is one
			  if(angular.isDefined(players[playerApiId].statusChangeCallback)){
				  players[playerApiId].statusChangeCallback.call(undefined,event,player);
			  }
		  }
		  
		  player.addEventListener('onStateChange','onYoutubePlayerStateChange'+playerIndex);
		  players[playerApiId].player = player;
		  
		  // tell the client the player has loaded
		  players[playerApiId].loadedCallback.call(undefined,player);
	  }
	  
	  return {
		  
		  /* loadPlayer - creates a swfobject using the videoDiv element
		   * videoDiv - elemet to replace with swfobject
		   * videoID - id of the youtube video to play
		   * loadedCallback - called when load complete
		   */ 
		  loadPlayer:function(videoDiv,videoID,loadedCallback){
		 
			  // create inique playerApi and player element ids
			  var playerApiId = "player"+playerIndex,playerId = "ytPlayer"+playerIndex++;
			  
		      // Lets Flash from another domain call JavaScript
			  var params = { allowScriptAccess: "always" };
			  // The element id of the Flash embed
			  var atts = { id:playerId };
			  // All of the magic handled by SWFObject (http://code.google.com/p/swfobject/)
			  swfobject.embedSWF("https://www.youtube.com/v/" + videoID + 
			                     "?version=3&enablejsapi=1&rel=0&playerapiid="+playerApiId, 
			                     videoDiv, "600", "338", "9", null, null, params, atts);
			  
			  // save player iformation for calling clients
			  players[playerApiId]={id:atts.id,loadedCallback:loadedCallback};
			  
			  // playerApiId is used by client to refence player for subsequent YOutube service calls
			  return playerApiId;
	      },
	    
		    /* 
		     * addStatusChangeCallback
		     * playerApiId - id retruned by loadPlayer
		     * statusChangeCallback - function to call when status changes
		     */
		    addStatusChangeCallback:function(playerApiId,statusChangeCallback){
		    	if(angular.isDefined(players[playerApiId])){
		    		players[playerApiId].statusChangeCallback = statusChangeCallback;
		    	}
		    },
	     unloadPlayer:function(playApiId){
	    	 
	     }
	  
	  }
	  
  }).directive('rrhVideoYoutube', function($document,$window,$timeout,Youtube){
		    return {
		      restrict: 'A',
		      // This HTML will replace the rrh-video directive.
		      replace: true,
		      transclude: true,
		      template: '<div id="videoDiv"></div>',

	          controller:function($scope){

	        	  
	          },
	          // The linking function will add behavior to the template
		      link: function postLink(scope, element, attrs) {
	    		  var youtubeTransportStates = ['ended','playing','paused','buffering','cued'];
    			  var playerId,youtubePlayer;
    			  var videoItem = scope.videoItem;
    			  function sendTimeEvent(){
    				  
    				  // timeout after video destroyed ? Just return
    				  if(angular.isUndefined(youtubePlayer)||angular.isUndefined(youtubePlayer.getPlayerState)){
    					  return;
    				  }
					  if(youtubePlayer.getPlayerState()==1 /* PLAYING */){
			          	if(angular.isDefined(scope.onTransport) && angular.isDefined(youtubePlayer.getPlayerState) &&
			          			angular.isDefined(youtubePlayer.getCurrentTime)){
			        		scope.onTransport(youtubeTransportStates[youtubePlayer.getPlayerState()],youtubePlayer.getCurrentTime());
			        	}
			          	$timeout(sendTimeEvent,500);
					  }
    			  }
		    	  
		    	  // observe changes to interpolated attribute
		    	  scope.$watch('videoItem', function(videoItem) {

		    	  
		    		  
		    		  if(angular.isUndefined(scope.videoItem)){
		    			  return;
		    		  }
	    	    	  playerId = Youtube.loadPlayer("videoDiv",videoItem.videoId,function(player){
	    	    		  youtubePlayer = player;
	    	    		  Youtube.addStatusChangeCallback(playerId,function(event,player){
	    	    			  sendTimeEvent();
	    	    		  });
	    	    		  player.seekTo(scope.location,true);
	    	    		  player.pauseVideo();
	    	    	  });
		    		  // listen on DOM destroy (removal) event, and cancel the next UI update
		    	      // to prevent updating time ofter the DOM element was removed.
		    	      element.bind('$destroy', function() {
		    	    	Youtube.unloadPlayer(playerId);
		    	      });	    		  
		    		  
		    	  });
		      
		      
		      }
		    }
		  });  

  
  
  
