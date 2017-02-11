---
---
(function($) {
	var loadTemplates = function(path){
		Stevenson.ui.Loader.display('Loading templates...', 100);
		layoutsPathWOLastSlash = Stevenson.Account.layoutsPath.substring(0,Stevenson.Account.layoutsPath.lastIndexOf('/'));
		editorsPathWOLastSlash = Stevenson.Account.editorsPath.substring(0,Stevenson.Account.editorsPath.lastIndexOf('/'));
		schemasPathWOLastSlash = Stevenson.Account.schemasPath.substring(0,Stevenson.Account.schemasPath.lastIndexOf('/'));
		
		Stevenson.repo.getFiles({
			path: layoutsPathWOLastSlash, //'_layouts',
			success: function(layouts){
				$('#templates').html('');
				Stevenson.repo.getFiles({
					path: editorsPathWOLastSlash, //'_editors',
					success: function(editors){
						$.each(layouts, function(index, layout){
							if(layout.path.indexOf('_layouts') != -1 && layout.path != layoutsPathWOLastSlash){ //'_layouts'
								Stevenson.log.info('Adding layout: '+layout.path);
								var id = layout.path.replace('.html','').replace(Stevenson.Account.layoutsPath,'');
								layout.id = id;
								layout.templateurl  ='{{ site.baseurl }}/cms/edit.html?editor=text#' + Stevenson.Account.layoutsPath + id + '.html';
								layout.editorurl = '{{ site.baseurl }}/cms/edit.html?new=true#' + Stevenson.Account.editorsPath + id + '.json'; //_editors/
								for(var i=0;i<editors.length;i++){
									if(editors[i].path == Stevenson.Account.editorsPath + +id+'.json'){ //'_editors/'
										layout.editorurl = '{{ site.baseurl }}/cms/edit.html#_editors/' + Stevenson.Account.editorsPath  + id + '.json'; //_editors/
										break;
									}
								}
								
								layout.path = Stevenson.Account.siteBaseURL + '/' + layout.path;
								
								$('#templates').mustache('template', layout);
							}
						});
						Stevenson.ui.Loader.hide();
					},
					error: function(message){
						Stevenson.ui.Loader.hide();
						Stevenson.ui.Messages.displayError('Unable to load editors: ' + message);
					}
				});
			},
			error: function(message){
				Stevenson.ui.Loader.hide();
				Stevenson.ui.Messages.displayError('Unable to load templates: ' + message);
			}
		});
		Stevenson.repo.getFiles({
			path: Stevenson.Account.schemasPath, //'_schemas',
			success: function(schemas){
				$('#templates').html('');
				Stevenson.repo.getFiles({
					path: schemasPathWOLastSlash, //'_schemas',
					success: function(schemas){
						$.each(schemas, function(index, schema){
							if(schema.path.indexOf('_schemas') != -1 && schema.path != schemasPathWOLastSlash){ //'_schemas'
								Stevenson.log.info('Adding schema: '+schema.path);
								var id = schema.path.replace('.html','').replace(Stevenson.Account.schemasPath,''); //'_schemas/'
								schema.id = id;
								schema.schemaurl = Stevenson.Account.siteBaseURL + '/cms/edit.html?new=true#' + Stevenson.Account.schemasPath + id + '.json'; // _schemas/
								for(var i=0;i<schemas.length;i++){
									if(schemas[i].path == Stevenson.Account.schemasPath + id+'.json'){ //'_schemas/'
										schema.schemaurl = Stevenson.Account.siteBaseURL + '/cms/edit.html#' + Stevenson.Account.schemasPath + id + '.json'; //_schemas/
										break;
									}
								}
								
								schema.path = Stevenson.Account.siteBaseURL + '/' + schema.path;
								
								$('#templates').mustache('template', schema);
							}
						});
						Stevenson.ui.Loader.hide();
					},
					error: function(message){
						Stevenson.ui.Loader.hide();
						Stevenson.ui.Messages.displayError('Unable to load schemas: ' + message);
					}
				});
			},
			error: function(message){
				Stevenson.ui.Loader.hide();
				Stevenson.ui.Messages.displayError('Unable to load templates: ' + message);
			}
		});
	};
	Stevenson.ext.afterInit(function() {
		
		Stevenson.log.info('Initializing files');
		$('#new-template').submit(function(){
			var templateName = $('input[name=template-name]').val();
			if(templateName.indexOf('.html') == -1){
				templateName += '.html';
			}
			window.location = '{{ site.baseurl }}/cms/edit.html?new=true#' + Stevenson.Account.layoutsPath + templateName; //_layouts/
			return false;
		});
		$('.breadcrumb .repo').html(Stevenson.Account.repo);
		loadTemplates();
	});
})(jQuery);
