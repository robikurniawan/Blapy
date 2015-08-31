/**
 * -----------------------------------------------------------------------------------------
 * INTERSEL - 4 cité d'Hauteville - 75010 PARIS
 * RCS PARIS 488 379 660 - NAF 721Z
 *
 * File : UPIApplication.js
 * UPIApplication : a jquery plugin that helps to handle and manage an ajax web application 
 * 					from a usual way of generating web pages like with php or a standard CMS
 *
 * -----------------------------------------------------------------------------------------
 * Modifications :
 * - 2015/07/25 - E.Podvin - V1.0.0 - Creation
 * - 2015/07/31 - E.Podvin - V1.0.1
 * - 2015/08/02 - E.Podvin - V1.0.3 - append/prepend features on UPI blocks
 * - 2015/08/04 - E.Podvin - V1.0.4 - fix on relative URL
 * - 2015/08/05 - E.Podvin - V1.0.5 - fix on a double pageready event sent
 * - 2015/08/07 - E.Podvin - V1.0.6 - add event UPIApplication_doCustomChange
 * - 2015/08/29 - E.Podvin - V1.0.7 - add post data capabilities
 * -----------------------------------------------------------------------------------------
 *
 * @copyright Intersel 2015
 * @fileoverview : UPIApplication is a jQuery plugin that helps you to create and manage an ajax web application.
 * @see {@link https://github.com/intersel/UPIApplication}
 * @author : Emmanuel Podvin - emmanuel.podvin@intersel.fr
 * @version : 1.0.6
 * -----------------------------------------------------------------------------------------
 */

/**
 * How to use it :
 * ===============
 *
 * see README.md content or consult it on https://github.com/intersel/UPIApplication
 */

(function($) {
 
	/**
	* 
	**/	
	var theUPIApplication = window.theUPIApplication = function (anObject, options)
	{
		
		var $defaults = {
				debug				: false, //if true, then log things in the console
				LogLevel			: 3,	 // log level: 1: error ; 2: warning; 3: notice
				alertError			: false,
				//function Hooks
				pageLoadedFunction	: null,
				pageReadyFunction	: null,
				beforePageLoad		: null,
				beforeContentChange	: null, //param: the UPI block whose content will change
				afterContentChange	: null, //param: the UPI block whose content has changed
				afterPageChange		: null,
				doCustomChange		: null,
				onErrorOnPageChange	: null,
				theUPIApplication	: this,
				
		};

		// on charge les options passées en paramètre
		if (options == undefined) options=null;
		this.opts = jQuery.extend( {}, $defaults, options || {});

		/**
		 * @param myUIObject		- Target object of the FSM
		 */
		this.myUIObject	= anObject;
		this.myUIObjectID = anObject.attr('id');
		if (!this.myUIObjectID) alert('no defined Id on the given jQuery object... UPI Application can\'t work properly :-(');
		
	};

	/**
	 * InitApplication - init the UPI Application
	 * public method
	 */
	theUPIApplication.prototype.InitApplication	= function() 
	{
		this._log('InitApplication');
		
		//Standard Routing definition
		var app = Sammy('#'+this.myUIObjectID);
		
		var myUPIApplication = this;
		
		app.get(/\#\/(.*)/, function() 
		{
			if(!this.params['action']) this.params['action']='update';

			switch(this.params['action'])
			{
				case 'update': 
				default:
					myUPIApplication.myUIObject.trigger('loadUrl',{aUrl:myUPIApplication.hashURL(),params:this.params,aObjectId:myUPIApplication.myUIObjectID});
					break;
			}
		});
		app.post(/\#\/(.*)/, function() 
				{
					if(!this.params['action']) this.params['action']='update';

					switch(this.params['action'])
					{
						case 'update': 
						default:
							myUPIApplication.myUIObject.trigger('postData',{aUrl:myUPIApplication.hashURL(this.path),params:this.params,aObjectId:myUPIApplication.myUIObjectID});
							break;
					}
				});
		
		this.myUIObject.iFSM(manageUPIApplication,this.opts);
		//app.run('#/');
		app.run(window.location.pathname+"#"+window.location.pathname);

	};//
	
	/**
	 * this._log - log function
	 * private function
	 * @param message - message to log
	 * @param error_level (default : 3) 	
	 * 			- 1 : it's an error
	 * 			- 2 : it's a warning
	 * 			- 3 : it's a notice
	 * 
	 */
	theUPIApplication.prototype._log = function (message) {
		/*global console:true */

		if (!this.opts.debug) return;
		if ( (arguments.length > 1) && (arguments[1] > this.opts.LogLevel) ) return; //on ne continue que si le nv de message est <= LogLevel
		if ( (arguments.length <= 1) && (3 > this.opts.LogLevel) ) return;// pas de niveau de msg défini => niveau notice (3)
		
		if (window.console && console.log)
		{
			console.log('[fsm] ' + message);
			if ( (arguments[1] == 1) && this.opts.alertError) alert(message);
		}
		
	};//end Log

	/**
	* get the hash part of the URL
	* returns 0 if none
	*/
	theUPIApplication.prototype.hashURL = function (aURL)
	{
		this._log('hashURL');

		if (!aURL) aURL = window.location.href;
		var results = new RegExp('[\#](.*)').exec(aURL);
		return results[1] || 0;
	};

	//creation function of UPIApplication that embeds jQuery 
	$.fn.UPIApplication = function(options) {
		if (!this.length) alert("The jquery selector '"+this.selector+"' is void!?\n\n Can\'t start UPI application...\n\n :-(");
		return this.each(function() {
			var UPIApplication = new theUPIApplication($(this), options);
			UPIApplication.InitApplication();	//start it
		});
	};
	
	/**
	* set # tag in the UPI Url
	* returns 0 if none
	*/
	theUPIApplication.prototype.setUPIUrl = function ()
	{
		this._log('setUPIUrl');

		//change href on upi-link
		$('[data-upi-link]').each(function() {
			
			if ($(this)[0].tagName == 'A')
				var aHref = $(this).attr("href");
			else if ($(this)[0].tagName == 'FORM')
				var aHref = $(this).attr("action");
			else 
				var aHref = $(this).attr("data-upi-href");
				
			if (!aHref) return;//not valid... for now
			
			
			if (aHref.indexOf('#') == -1) {
				
				var hashHref;

				if( 	(aHref.charAt(0) != '/')
					&& 	(aHref.substring(0,4) != "http")
				  )
				{
					var aBaseHref=$('base').attr('href');
					if (aBaseHref)
						aHref = aBaseHref+aHref;
					else
						aHref = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)+aHref;
				}
				
				if (aHref.indexOf("?") > 0)
					hashHref = aHref.slice(0, aHref.indexOf("?"));
				else 
					hashHref = aHref;
				
				if ($(this)[0].tagName == 'A')
					$(this).attr("href",hashHref+'#'+aHref);
				else if ($(this)[0].tagName == 'FORM')
					$(this).attr("action",hashHref+'#'+aHref);
				else 
					$(this).attr("data-upi-href",hashHref+'#'+aHref);
			} 

		});
	};

	/* var & function definitions */	
	var manageUPIApplication = {
        PageLoaded: 
        {
             enterState:
            {
                init_function: function(){
					if (this.opts.pageLoadedFunction) this.opts.pageLoadedFunction();
					this.myUIObject.trigger('UPIApplication_PageLoaded');
				},
           },
           loadUrl:   //no load URL at first load of the page (generated by sammy)
            {
                 next_state: 'PageReady',
            },
         }, 
        PageReady: 
        {
            enterState:   
            {
                init_function: function(){
                	// set #tag to the UPI url
                	this.opts.theUPIApplication.setUPIUrl();
                	if (this.opts.pageReadyFunction) this.opts.pageReadyFunction();
					this.myUIObject.trigger('UPIApplication_PageReady');
				}
            },
            loadUrl:   
            {
                init_function: function(){
					if (this.opts.beforePageLoad) this.opts.beforePageLoad();
					this.myUIObject.trigger('UPIApplication_beforePageLoad');
				},
                out_function: function(p,e,data){
					var aFSM 		= this;
					var aUrl		= data.aUrl;
					var aObjectId	= data.aObjectId?data.aObjectId:e.currentTarget.id;
					var params		= data.params;
					
					jQuery.ajax({
						  type: 'GET', 
						  url: aUrl, 
						  data: "upicall=1&upiaction="+params.action+"&upiobjectid="+aObjectId,
						  success: function(data, textStatus, jqXHR) {
							aFSM.trigger('pageLoaded',{htmlPage:data,params:params});
						  },
						  error: function(jqXHR, textStatus, errorThrown) {
							aFSM.trigger('errorOnLoadingPage',aUrl+': '+errorThrown);
						  }
						});
				},
                next_state: 'ProcessPageChange'

            },
            postData:   
            {
                init_function: function(){
					if (this.opts.beforePageLoad) this.opts.beforePageLoad();
					this.myUIObject.trigger('UPIApplication_beforePageLoad');
				},
                out_function: function(p,e,data){
					var aFSM 		= this;
					var aUrl		= data.aUrl;
					var aObjectId	= data.aObjectId?data.aObjectId:e.currentTarget.id;
					var params		= data.params;
					
					params = jQuery.extend( params, {upicall:"1",upiaction:params.action,upiobjectid:aObjectId});
					
					jQuery.ajax({
						  type: 'POST', 
						  url: aUrl, 
						  data: params,
						  success: function(data, textStatus, jqXHR) {
							aFSM.trigger('pageLoaded',{htmlPage:data,params:params});
						  },
						  error: function(jqXHR, textStatus, errorThrown) {
							aFSM.trigger('errorOnLoadingPage',aUrl+': '+errorThrown);
						  }
						});
				},
                next_state: 'ProcessPageChange'

            }
        },
        ProcessPageChange: 
        {
            enterState:   
            {
            },
            pageLoaded:   
            {
                init_function: function(p,e,data){
					var pageContent	= data.htmlPage;
					var params 		= data.params;
					var aObjectId	= this.myUIObject.attr('id');
					var myFSM		= this;
					
					switch(params['action'])
					{
						case 'update': 
						default:
							
							this.myUIObject.find('[data-upi-container]').each(function(){
								
								var myContainer = $(this);
								if (!params['force-update']) params['force-update']=0; 
								var containerName = myContainer.attr('data-upi-container-name');
								
								//get the UPI Container named <containerName>
								var aUPIContainer=jQuery(pageContent)
												.filter('[data-upi-container-name="'+containerName+'"]')
												.add(jQuery(pageContent)
														.find('[data-upi-container-name="'+containerName+'"]')
												).first();
								
								//container not found
								if (!aUPIContainer || aUPIContainer.length == 0) 
								{
									return;
								}
								else if (aUPIContainer.attr('data-upi-applyon') != undefined)
								{
									//if the container specifies the accepted applications and we're not processing the correct one (aObjectId), then exit
									var aListOfApplications = aUPIContainer.attr('data-upi-applyon').split(","); 
									if ( (aListOfApplications.length > 0)
											&& ($.inArray(aObjectId,aListOfApplications) == -1)
										) return;

								}
								
								//alert that the content of the block will change
								if (myFSM.opts.beforeContentChange) myFSM.opts.beforeContentChange(myContainer);
								myContainer.trigger('UPIApplication_beforeContentChange',this.myUIObject);
								
								var dataUpiUpdate = aUPIContainer.attr('data-upi-update');
								var dataUpiUpdateRuleIsLocal = false;
								if (myContainer.attr('data-upi-update-rule') == 'local')
								{
									dataUpiUpdate = myContainer.attr('data-upi-update');
									dataUpiUpdateRuleIsLocal = true;
								}
								
								//standard update
								if (	!dataUpiUpdate
										 ||	(dataUpiUpdate== 'update')
										)
								{
									if ( 	aUPIContainer.attr('data-upi-container-content') != myContainer.attr('data-upi-container-content')
										||  ( params['force-update'] == 1 ) 
										)
									{
										if (dataUpiUpdateRuleIsLocal)
										{
											myContainer.html(aUPIContainer.html());//replace content with the new one
										}
										else
										{
											myContainer.replaceWith(aUPIContainer[0].outerHTML);//replace content with the new one
										}
										myContainer=aUPIContainer;
									}	
								}
								//append update
								else if (dataUpiUpdate== 'force-update')
								{
									if (dataUpiUpdateRuleIsLocal)
									{
										myContainer.html(aUPIContainer.html());//replace content with the new one
									}
									else
									{
										myContainer.replaceWith(aUPIContainer[0].outerHTML);//replace content with the new one
									}
									myContainer=aUPIContainer;
								}
								//append update
								else if (dataUpiUpdate== 'append')
								{
									aUPIContainer.prepend(myContainer.html());//we prepend the old content to the new one (~to append the new one to the old one ;-))
									if (dataUpiUpdateRuleIsLocal)
									{
										myContainer.html(aUPIContainer.html());//replace content with the new one
									}
									else
									{
										myContainer.replaceWith(aUPIContainer[0].outerHTML);//replace content with the new one
									}
									myContainer=aUPIContainer;
								}
								//prepend update
								else if (dataUpiUpdate== 'prepend')
								{
									aUPIContainer.append(myContainer.html());
									if (dataUpiUpdateRuleIsLocal)
									{
										myContainer.html(aUPIContainer.html());//replace content with the new one
									}
									else
									{
										myContainer.replaceWith(aUPIContainer[0].outerHTML);//replace content with the new one
									}
									myContainer=aUPIContainer;
								}
								//replace update
								else if (dataUpiUpdate== 'replace')
								{
									myContainer.replaceWith(aUPIContainer.html());//replace content with the new inner one
									myContainer=aUPIContainer;
								}
								//custom update
								else if (dataUpiUpdate== 'custom')
								{
									if ( 	aUPIContainer.attr('data-upi-container-content') != myContainer.attr('data-upi-container-content')
											||  ( params['force-update'] == 1 ) 
										)
									{
										if (myFSM.opts.doCustomChange) myFSM.opts.doCustomChange(myContainer,aUPIContainer);
										myContainer.trigger('UPIApplication_doCustomChange',aUPIContainer);
									}
								}
								//remove update
								else if (dataUpiUpdate== 'remove')
								{
									var myContainerParent = myContainer.parent();
									myContainer.replaceWith('');//replace content with the new one
									myContainer=myContainerParent;
								}
								//json update
								else if (dataUpiUpdate== 'json')
								{
									var jsonData = aUPIContainer.html();
									var htmlTpl = myContainer.find('[data-upi-container-tpl]');
									if (htmlTpl.length == 0)
									{
										htmlTplContent = myContainer.html();
										myContainer.prepend('<div style="display:none" data-upi-container-tpl="true">'+htmlTplContent+'</div>');
									}
									else
									{
										htmlTplContent=htmlTpl.html();
									}
									eval("jsonData="+jsonData);
									var newHtml = json2html.transform(jsonData,  {'tag':'div','html':htmlTplContent} );
									myContainer.html(htmlTpl[0].outerHTML+newHtml);//replace content with the new one
									myContainer=aUPIContainer;
								}
								else
								{
									var pluginUpdateFunction = eval("myFSM.opts.theUPIApplication."+aUPIContainer.attr('data-upi-update'));
									
									if (pluginUpdateFunction)
									{
										if ( 	aUPIContainer.attr('data-upi-container-content') != myContainer.attr('data-upi-container-content')
												||  ( params['force-update'] == 1 ) 
												||  aUPIContainer.attr('data-upi-container-force-update') == "true" 
											)
										{
											pluginUpdateFunction(myContainer,aUPIContainer);
										}
										
									}
									else myFSM._log(aUPIContainer.attr('data-upi-update')+' does not exist',1);
								
								}

								if (myFSM.opts.afterContentChange) myFSM.opts.afterContentChange(myContainer);
								//try to send to the new object the alert
								if (myContainer.attr('id'))
									$('#'+myContainer.attr('id')).trigger('UPIApplication_afterContentChange',myContainer);

							});//end of each
							break;
					};//switch
				},
                out_function: function(p,e,data){
					if (this.opts.afterPageChange) this.opts.afterPageChange();
					this.myUIObject.trigger('UPIApplication_afterPageChange');
				},
                next_state: 'PageReady',
            },
            errorOnLoadingPage:   
            {
                init_function: function(p,e,data){
					if (this.opts.onErrorOnPageChange) this.opts.onErrorOnPageChange(data);
					this.myUIObject.trigger('UPIApplication_ErrorOnPageChange',[data]);
				},
                next_state: 'PageReady',
            },
        },
        DefaultState:
        {
            start:
            {
                next_state: 'PageLoaded',
            }
        }
    };

 
})(jQuery);

