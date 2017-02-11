---
---
var Stevenson = {
	/**
	 * Holds the current account information.  
	 */
	Account: {
		authenticated : false,
		branch : '',
		favoriteRepos : [],
		name : '',
		password : '',
		repo : '',
		subFolder: '/',
		subFolderDetector: '_config.yml',
		schemasFolder: 'schemas',
		studiesFolder: 'studies',
		layoutsFolder: '_layouts',
		editorsFolder: '_editors',
		templatesFolder: 'templates',
		schemaExtension: '.jctx',
		documentBaseURL: '{{ site.url}}',
		siteBaseURL: '{{ site.baseurl }}',
		forkRootName: 'CohortEx',
		username : '',
		/**
		 * Clears the account information from the session and local storage
		 */
		clear : function () {
			Stevenson.Account.authenticated = false;
			Stevenson.Account.branch = '';
			Stevenson.Account.favoriteRepos = [];
			Stevenson.Account.name = '';
			Stevenson.Account.password = '';
			Stevenson.Account.repo = '';
			Stevenson.Account.username = '';
			Stevenson.Account.save();
		},
		/**
		 * Loads the account information from Local Storage
		 */
		load : function () {
			var acct = Stevenson.session.get('Stevenson.repo.Account');
			if (acct !== null && acct.authenticated) {
				$.extend(Stevenson.Account, acct);
			}
		},
		/**
		 * Saves the account information to Local Storage
		 */
		save : function() {
			Stevenson.session.set('Stevenson.repo.Account', Stevenson.Account);
		}
	},
	ext: {
		addHookMethod: function(hook, method){
			Stevenson.ext.methods[hook].push(method);
		},
		afterInit: function(afterInit){
			Stevenson.ext.addHookMethod('afterInit', afterInit);
		},
		beforeInit: function(beforeInit){
			Stevenson.ext.addHookMethod('beforeInit', beforeInit);
		},
		getMethods: function(hook){
			return (Stevenson.ext.methods[hook]) ? Stevenson.ext.methods[hook] : [];
		},
		methods : {
			afterInit: [],
			beforeInit: []
		}
	},
	init: function() {
		Stevenson.log.debug("Invoking beforeinit methods");
		$.each(Stevenson.ext.getMethods('beforeInit'), function(index, initMethod) {
			try {
				initMethod();
			} catch (e) {
				Stevenson.log.error('Exception calling method ' + initMethod, e);
			}
		});

		Stevenson.log.debug("Loading the global CMS template");
		$.Mustache.load('{{ site.baseurl }}/templates/stevCms.html').done(function(){		
			Stevenson.log.info('Initializing application');

			// Pre-start checks
			if (!localStorage) {
				alert('Your browser is not supported!  Please use a supported browser.');
			}

			// Start up the account
			Stevenson.Account.load();
			Stevenson.repo.layouts = Stevenson.session.get("Stevenson.repo.layouts");
			Stevenson.repo.schemas = Stevenson.session.get("Stevenson.repo.schemas");
			
			Stevenson.Account.layoutsPath = Stevenson.session.get("Stevenson.repo.layoutsPath");
			Stevenson.Account.editorsPath = Stevenson.session.get("Stevenson.repo.editorsPath");
			Stevenson.Account.schemasPath = Stevenson.session.get("Stevenson.repo.schemasPath");
			Stevenson.Account.templatesPath = Stevenson.session.get("Stevenson.repo.templatesPath");
			Stevenson.Account.subFolder   = Stevenson.session.get("Stevenson.repo.subFolder");

			Stevenson.log.debug('Checking to see if need to login');
			if (Stevenson.loginRequired && Stevenson.Account.authenticated == false) {
				$('#login-modal').modal({
					backdrop: 'static',
					keyboard: false,
					show: true
				});
			}else{
				if (Stevenson.Account.authenticated && Stevenson.Account.authenticated == true) {
					Stevenson.log.debug("Adding logged in top section");
					$.Mustache.load('{{ site.baseurl }}/templates/stevAuthentication.html').done(function () {
						$('#top-login').html('');
						$('#top-login').mustache('top-bar', {name: Stevenson.Account.name, siteBaseURL: '{{ site.baseurl }}'});
					});
				}
				Stevenson.log.debug("Calling after Init methods");
				$.each(Stevenson.ext.getMethods('afterInit'), function(index, initMethod) {
					try {
						initMethod();
					} catch (e) {
						Stevenson.log.error('Exception calling method ' + initMethod, e);
					}
				});
			}
		});
	},
	log: {
		debug : function() {
			if (typeof console === 'undefined') {
				return;
			}
			console.debug.apply(console, arguments);
		},
		info : function() {
			if (typeof console === 'undefined') {
				return;
			}
			console.info.apply(console, arguments);
		},
		warn : function() {
			if (typeof console === 'undefined') {
				return;
			}
			console.warn.apply(console, arguments);
		},
		error : function() {
			if (typeof console === 'undefined') {
				return;
			}
			console.error.apply(console, arguments);
		}
	},
	/**
	 *  Wrapper for the GitHub Repository
	 */
	repo: {
		layouts: [],
		schemas: [],
		copyFile: function(options){
			var settings = $.extend({}, {
				success: function(file){},
				error: function(err){}
			}, options);
			Stevenson.repo.getFile({
				success: function(page){
					page.path = settings.newPath;
					Stevenson.repo.savePage({
						message: "Copying contents of file "+settings.oldFile+" to "+settings.newFile,
						path: settings.newPath,
						page: page,
						success: settings.success,
						error: settings.error
					});
				},
				error: settings.error,
				path: settings.oldPath
			});
		},
		deleteFile: function(options){
			var settings = $.extend({}, {
				success: function(file){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.delete(Stevenson.Account.branch, settings.path, function(err, file) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					settings.success(settings.path);
				}
			});
		},
		getAllFiles: function(options){
			var settings = $.extend({}, {
				success: function(files){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getTree(Stevenson.Account.branch + '?recursive=true', function(err, tree) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					settings.success(tree);
				}
			});
		},
		/**
		 * Loads the branches available for the specified repository.
		 */
		getBranches: function(options) {
			var settings = $.extend({}, {
				success: function(branches){},
				error: function(err){},
				repoName: ''
				}, options);

			Stevenson.log.debug('Loading branches for repository: '+settings.repoName);
			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(settings.repoName.split('/')[0],
					settings.repoName.split('/')[1]);
			repo.listBranches(function(err, branches) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					settings.success(branches);
				}
			});
		},
		getErrorMessage : function(err) {
			if(err.request){
				var errObj = JSON.parse(err.request.responseText);
				return errObj.message;
			}else{
				return err;
			}
		},
		getFile: function(options){
			var settings = $.extend({}, {
				success: function(file){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.read(Stevenson.Account.branch, settings.path, function(err, file) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {

					var page = new Page(settings.path, file);
					settings.success(page);
				}
			});
		},
		getAllFiles: function(options){
			var settings = $.extend({}, {
				success: function(files){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getTree(Stevenson.Account.branch + '?recursive=true', function(err, tree) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug("Trying to load files under path: " + settings.path);
					var files = [];
					for(var i=0; i < tree.length; i++) {
						var rf = tree[i];
						if(rf.path.indexOf(settings.path) == 0) {
							files.push(rf.path);
						} else {
							Stevenson.log.debug("Skipping file: " + rf.path);
						};
					}
					settings.success(files);
				};
			});
		},
		getFiles: function(options){
			var settings = $.extend({}, {
				success: function(files){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getTree(Stevenson.Account.branch + '?recursive=true', function(err, tree) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug("Trying to load files at path: " + settings.path);
					var files = [];
					var folders = [];
					for(var i=0; i < tree.length; i++) {
						var rf = tree[i];
						if(rf.path.indexOf(settings.path) == 0) {
							var name = rf.path;
							if(settings.path != ''){
								name = rf.path.substr(settings.path.length + 1);
							}
							var file = {};
							if(name.indexOf('/') == -1) {
								Stevenson.log.debug("Adding file: " + rf.path);
								file.name = name;
								file.path = rf.path;

								if(file.name == '') {
									file.name = '..';
									file.type = 'folder-close';
									file.path = rf.path.substr(0, rf.path.lastIndexOf('/'));
									folders.push(file);
								} else if (rf.type == 'blob') {
									file.type = 'file';
									file.size = rf.size;
									file.sha = rf.sha;
									files.push(file);
								} else {
									file.type = 'folder-close';
									folders.push(file);
								};
							} else {
								Stevenson.log.debug("Skipping child file: " + rf.path);
							};
						} else {
							Stevenson.log.debug("Skipping file: " + rf.path);
						};
					}
					settings.success(folders.concat(files));
				};
			});
		},
		getGitHub: function(){
			return new Github({
				username : Stevenson.Account.username,
				password : Stevenson.Account.password,
				auth : "basic"
			});
		},

		getLayoutsAndSchemas: function(options) {
			var settings = $.extend({}, {
				success: function(files){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getTree(Stevenson.Account.branch + '?recursive=true', function(err, tree) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug("Trying to load layouts");
					var layouts = [];
					var schemas = [];
					
					//Not really necessary
					Stevenson.Account.subFolder = '';
					Stevenson.Account.layoutsPath= '';
					Stevenson.Account.schemasPath = '';
					Stevenson.Account.editorsPath = '';
					Stevenson.Account.templatesPath = '';
					Stevenson.Account.studiesPath = '';
					
					for(var i=0; i < tree.length; i++) {
						var rf = tree[i];
						
						var posPathLayouts = rf.path.indexOf(Stevenson.Account.layoutsFolder);
						var posPathEditors = rf.path.indexOf(Stevenson.Account.editorsFolder);
						var posPathSchemas = rf.path.indexOf(Stevenson.Account.schemasFolder);
						var posPathTemplates = rf.path.indexOf(Stevenson.Account.templatesFolder);
						var posPathSubFolder = rf.path.indexOf(Stevenson.Account.subFolderDetector);
						var posPathStudies = rf.path.indexOf(Stevenson.Account.studiesFolder);
						
						//Detect docs
						if(posPathSubFolder >= 0) {
							Stevenson.Account.subFolder = rf.path.substring(0,posPathSubFolder);
							Stevenson.log.info("Define subFolder as: " + Stevenson.Account.subFolder);								
						}
						
						if( posPathLayouts >= 0) {
							var nameLayout = rf.path.substr(posPathLayouts + Stevenson.Account.layoutsFolder.length + 1);
							nameLayout = nameLayout.substring(0, nameLayout.indexOf('.'));
							layouts.push(nameLayout);
							if (nameLayout.length == 0){
								Stevenson.Account.layoutsPath = rf.path +  '/' ;
								Stevenson.log.info("Define layoutsPath as: " + Stevenson.Account.layoutsPath);								
							}
						} else {
							if ( posPathSchemas >= 0) {
								var nameSchema = rf.path.substr(posPathSchemas + Stevenson.Account.schemasFolder.length + 1);
								nameSchema = nameSchema.substring(0, nameSchema.lastIndexOf('.'));
								schemas.push(nameSchema);
								if (nameSchema.length == 0){
									Stevenson.Account.schemasPath = rf.path +  '/' ;
									Stevenson.log.info("Define schemasPath as: " + Stevenson.Account.schemasPath);								
								}
							} else {
								if ( posPathEditors >= 0) {
									var nameEditor = rf.path.substr(posPathEditors + Stevenson.Account.editorsFolder.length + 1);
									nameEditor = nameEditor.substring(0, nameEditor.lastIndexOf('.'));
									if (nameEditor.length == 0){
										Stevenson.Account.editorsPath = rf.path +  '/' ;
										Stevenson.log.info("Define editorsPath as: " + Stevenson.Account.editorsPath);								
									}
								} else {
									if (posPathTemplates >= 0 && rf.path == Stevenson.Account.subFolder + Stevenson.Account.templatesFolder) {
										Stevenson.Account.templatesPath = rf.path + '/';
										Stevenson.log.info("Define templatesPath as: " + Stevenson.Account.templatesPath);								
									} else {
										if (posPathStudies >= 0 && posPathStudies + Stevenson.Account.studiesFolder.length == rf.path.length) {
											Stevenson.Account.studiesPath = rf.path;
											Stevenson.log.info("Define studiesPath as: " + Stevenson.Account.studiesPath);
										} else {
											//Stevenson.log.debug("Skipping file: " + rf.path);								
										}
									}
								}
							}
						};
					}
					Stevenson.repo.layouts = layouts;
					Stevenson.session.set("Stevenson.repo.layouts", layouts);
					Stevenson.session.set("Stevenson.repo.layoutsPath", Stevenson.Account.layoutsPath);
					
					Stevenson.session.set("Stevenson.repo.editorsPath", Stevenson.Account.editorsPath);
					Stevenson.session.set("Stevenson.repo.templatesPath", Stevenson.Account.templatesPath);
					Stevenson.session.set("Stevenson.repo.subFolder", Stevenson.Account.subFolder);

					Stevenson.repo.schemas = schemas;
					Stevenson.session.set("Stevenson.repo.schemas", schemas);
					Stevenson.session.set("Stevenson.repo.schemasPath", Stevenson.Account.schemasPath);
					
					settings.success(layouts);
				};
			});
		},
		
		getLayouts: function(options) {
			var settings = $.extend({}, {
				success: function(files){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getTree(Stevenson.Account.branch + '?recursive=true', function(err, tree) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug("Trying to load layouts");
					var layouts = [];
					for(var i=0; i < tree.length; i++) {
						var path = "_layouts";
						var rf = tree[i];
						var posPath = rf.path.indexOf(path);
						if( posPath >= 0) {
							var name = rf.path.substr(posPath + path.length + 1);
							name = name.substring(0, name.indexOf('.'));
							layouts.push(name);
						} else {
							Stevenson.log.debug("Skipping file: " + rf.path);
						};
					}
					Stevenson.repo.layouts = layouts;
					Stevenson.session.set("Stevenson.repo.layouts", layouts);
					settings.success(layouts);
				};
			});
		},

		getSchemas: function(options) {
			var settings = $.extend({}, {
				success: function(files){},
				error: function(err){}
				}, options);

			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getTree(Stevenson.Account.branch + '?recursive=true', function(err, tree) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug("Trying to load schemas");
					var schemas = [];
					for(var i=0; i < tree.length; i++) {
						var path = "_schemas";
						var rf = tree[i];
						if(rf.path.indexOf(path) == 0) {
							var name = rf.path.substr(path.length + 1);
							name = name.substring(0, name.lastIndexOf('.'));
							schemas.push(name);
						} else {
							Stevenson.log.debug("Skipping file: " + rf.path);
						};
					}
					Stevenson.repo.schemas = schemas;
					Stevenson.session.set("Stevenson.repo.schemas", schemas);
					settings.success(schemas);
				};
			});
		},
		getEditorConfig: function(options){
			var settings = $.extend({}, {
				success: function(repo){},
				error: function(err){}
			}, options);
            if (settings.layout && settings.layout !== null) {
                Stevenson.repo.getFile({
                    path: Stevenson.Account.editorsPath  +  settings.layout + '.json',
                    success: function(file){
						//Here stops the recursion. Any file can have nested layouts but only one 'must have' json file
                        settings.success(JSON.parse(file.getPageContent()));
						
						//CohortExDev: Now check if there is a schema to read
						if (settings.schema && settings.schema !== null) {
							Stevenson.repo.getFile({
								path: Stevenson.Account.schemasPath + settings.schema + '.json',
								success: function(file){
									settings.configSchema(JSON.parse(file.getPageContent()));
								},
								error:  function(message){
									settings.error('Schema: ' + Stevenson.Account.schemasPath + settings.schema + '.json ' + message);
								}
							});
						}
                    },
                    error:  function(message){
						//Try to read a settings.layout + '.html' file
                        Stevenson.repo.getFile({
                            path:Stevenson.Account.layoutsPath +  settings.layout + '.html',
                            success: function(file){
                                var properties = file.getProperties();
                                if(properties && properties.layout){
									//Ok, file read. Now recurse over it until find a json
                                    Stevenson.repo.getEditorConfig({
                                        success: settings.success,
                                        error: settings.error,
                                        layout: properties.layout
                                    });
                                }else{
                                    settings.error('not configured');
                                }
                            },
                            error:settings.error
                        });
                    }
                });
            }
		},
		getHistory: function(options) {
			var settings = $.extend({}, {
				success: function(repo){},
				error: function(err){}
			}, options);
			var gh = Stevenson.repo.getGitHub(options);
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.getCommits({path: settings.path}, function(err, orgs) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					settings.success(orgs);
				}
			});
		},
		getEmails: function(options) {
			var settings = $.extend({}, {
				success: function(repo){},
				error: function(err){}
			}, options);
			var gh = Stevenson.repo.getGitHub(options);
			var user = gh.getUser();
			user.emails(function(err, emails) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					settings.success(emails);
				}
			});
		},
		getOrgs: function(options) {
			var settings = $.extend({}, {
				success: function(repo){},
				error: function(err){}
			}, options);
			var gh = Stevenson.repo.getGitHub(options);
			var user = gh.getUser();
			user.orgs(function(err, orgs) {
				if (err) {
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					settings.success(orgs);
				}
			});
		},
		getRepo: function(options){
			var settings = $.extend({}, {
				success: function(repo){},
				error: function(err){}
			}, options);

			var gh = Stevenson.repo.getGitHub(options);
			try{
				var repo = gh.getRepo(options.name.split('/')[0], options.name.split('/')[1]);
				repo.show(function(err, repo) {
					if (err) {
						settings.error(Stevenson.repo.getErrorMessage(err));
					} else {
						settings.success(repo);
					}
				});
			} catch (e){
				settings.error(e.message);
			}
		},
		getRepos: function(options){
			var settings = $.extend({}, {
				success: function(branches){},
				error: function(err){}
			}, options);
			var gh = Stevenson.repo.getGitHub(options);
			var user = gh.getUser();
			if(settings.group && settings.group != ''){
				user.orgRepos(settings.group, function(err, repos) {
					if (err) {
						settings.error(Stevenson.repo.getErrorMessage(err));
					} else {
						settings.success(repos);
					}
				});
			} else {
				user.repos(function(err, repos) {
					if (err) {
						settings.error(Stevenson.repo.getErrorMessage(err));
					} else {
						settings.success(repos);
					}
				});
			}
		},
		login: function(options){
			var settings = $.extend({}, {
				success: function(user){},
				error: function(err){}
				}, options);
			var gh = Stevenson.repo.getGitHub();
			var user = gh.getUser();
			user.show(null, function(err, user) {
				if (err) {
					Stevenson.log.debug('Login failed');
					Stevenson.Account.clear();
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug('Login successsful');
					Stevenson.Account.authenticated = true;
					Stevenson.Account.name = user.name;
					Stevenson.Account.save();
					Stevenson.session.set('user',user);
					settings.success(user);
				}
			});
		},
		moveFile: function(options){
			var settings = $.extend({}, {
				success: function(file){},
				error: function(err){}
			}, options);
			Stevenson.repo.getFile({
				success: function(page){
					page.path = settings.newPath;
					Stevenson.repo.savePage({
						message: "Copying contents of file "+settings.oldFile+" to "+settings.newFile,
						path: settings.newPath,
						page: page,
						success: function(){
							Stevenson.repo.deleteFile({
								success: settings.success,
								error: settings.error,
								path: settings.oldPath
							});
						},
						error: settings.error
					});
				},
				error: settings.error,
				path: settings.oldPath
			});
		},
		savePage: function(options){
			var settings = $.extend({}, {
				success: function(user){},
				error: function(err){}
			}, options);
			if(settings.path.indexOf('/')==0){
				settings.path = settings.path.substring(1);
			}
			var gh = Stevenson.repo.getGitHub();
			var repo = gh.getRepo(Stevenson.Account.repo.split('/')[0], Stevenson.Account.repo
					.split('/')[1]);
			repo.write(Stevenson.Account.branch, settings.path, settings.page.content, settings.message, function(err) {
				if (err) {
					Stevenson.log.debug('Failed to save changes');
					settings.error(Stevenson.repo.getErrorMessage(err));
				} else {
					Stevenson.log.debug('Changes saved successfully');
					settings.success();
				}
			});
		}
	},
	/**
	 * Wrapper for sessionStorage, allows for getting and setting Objects.
	 */
	session: {
		/**
		 * Gets a value or object from LocalStorage
		 */
		get : function(key) {
			if (sessionStorage.getItem(key + '.isObj')
					&& sessionStorage.getItem(key + '.isObj') == "true") {
				return JSON.parse(sessionStorage.getItem(key));
			} else {
				return sessionStorage.getItem(key);
			}
		},
		/**
		 * Checks to see if sessionStorage contains a value for the key.
		 */
		has : function(key) {
			return sessionStorage.hasOwnProperty(key);
		},
		/**
		 * Removes the value for the key from sessionStorage
		 */
		remove : function(key) {
			return sessionStorage.removeItem(key);
		},
		/**
		 * Persists the value or object into sessionStorage
		 */
		set : function(key, value) {
			var toSet = value;
			if (typeof value == 'object') {
				toSet = JSON.stringify(value);
				sessionStorage.setItem(key + '.isObj', true);
			} else {
				sessionStorage.setItem(key + '.isObj', false);
			}
			sessionStorage.setItem(key, toSet);
		}
	},
	/**
	 * User interface methods.
	 */
	ui: {
		ContentEditor: {
			currentEditor:null,
			configure: function(config){
				Stevenson.ui.ContentEditor.currentEditor.configure(config);
			},
			setContent: function(page) {
				$('.content').html('');
				var editor = Stevenson.util.getParameter('editor');
				if (editor != '') {
					var editors = Stevenson.ui.ContentEditor.editors;
					for(var i = 0; i < editors.length; i++) {
						if(editor == editors[i].name) {
							Stevenson.ui.ContentEditor.currentEditor = editors[i];
							Stevenson.log.debug('Using editor ' + editors[i].name);
							break;
						}
					}
				} else {
					var editors = Stevenson.ui.ContentEditor.editors;
					for(var i = 0; i < editors.length; i++) {
						if(page.path.toLowerCase().match(editors[i].regex)) {
							Stevenson.ui.ContentEditor.currentEditor = editors[i];
							Stevenson.log.debug('Using editor ' + editors[i].name);
							break;
						}
					}
				}
				
				$.Mustache.load('{{ site.baseurl }}/templates/stevCms.html').done(function () {
					Stevenson.ui.ContentEditor.currentEditor.setContent(page);
				});
			},
			getContent: function(page){
				return Stevenson.ui.ContentEditor.currentEditor.getContent(page);
			},
			editors: [
				{
					name: 'rte',
					regex: '^.+\.(htm|html)$',
					configure: function(config){
						Stevenson.repo.getAllFiles({
							path: '',
							success: function(files){
								var imageList = [];
								$.each(files,function(index, file){
									if(file.match(/.+\.(?:jpg|jpeg|ico|gif|png)$/i)){
										imageList.push({
											title: '/'+file,
											value: '/'+file
										});
									}
								});
								var rteConfig = $.extend({
									relative_urls: false,
									convert_urls: false,
									selector: '#content',
									plugins: [
										"autolink lists link image charmap print preview hr anchor pagebreak",
										"searchreplace wordcount visualblocks visualchars code fullscreen",
										"insertdatetime media nonbreaking save table contextmenu directionality",
										"emoticons template paste textcolor"
									],
									toolbar1: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code",
									image_advtab: true,
									menubar: false,
									image_list: imageList
								}, config.rte);
								// CohortExDev - Correct url to actual value
								rteConfig.document_base_url = '{{ site.baseurl }}';
								tinymce.init(rteConfig);
							}
						});

					},
					setContent: function(page){
						$('.content').mustache('page-content-textarea', {content: page.getPageContent()});
					},
					getContent: function(){
						return tinymce.activeEditor.getContent();
					}
				},
				{
					name: 'text',
					regex: '^.+\.(json|yaml|yml|css|js|txt|gitignore|xml|php|rb)$',
					configure: function(config){
					},
					setContent: function(page){
						$('.content').mustache('page-content-textarea', {content: page.getPageContent()});
					},
					getContent: function(){
						return $('#content').val();
					}
				},
                {
                    name: 'json',
                    regex: '^.+\.(json|jctx)$',
                    configure: function (config){
						if (typeof config.$schema !== 'undefined') {
							var jsonEditOptions = {
							ajax: true,
							disable_array_add: false,
							disable_array_delete: false,
							disable_array_reorder: true,
							disable_collapse: false,
							disable_edit_json: true,
							disable_properties: true,
							form_name_root: "cohortex",
							iconlib: "bootstrap2",
							no_additional_properties: true,
							refs: {},
							required_by_default: true,
							keep_oneof_values: true,
							schema: config,

							show_errors: "interaction",
							startval: null,
							template: 'default',
							theme: 'bootstrap2',
							display_required_only: false
							};
							Stevenson.ui.ContentEditor.currentEditor.jsonEditor = new JSONEditor($('div#json-editor')[0],jsonEditOptions);
							Stevenson.ui.ContentEditor.currentEditor.jsonEditor.setValue(JSON.parse(Stevenson.ui.ContentEditor.currentEditor.editorContent)); 
						}
                    },
                    setContent: function(page){
                        $('.content').mustache('page-content-json', {content: page.getPageContent()});
                        Stevenson.ui.ContentEditor.currentEditor.editorContent = page.getPageContent();
                    },
                    getContent: function(){
						Stevenson.ui.ContentEditor.currentEditor.editorContent = Stevenson.ui.ContentEditor.currentEditor.jsonEditor.getValue();
                        return JSON.stringify(Stevenson.ui.ContentEditor.currentEditor.jsonEditor.getValue(), null, '\t');
                    }
                },
				{
					name: 'markdown',
					regex: '^.+\.(md|markdown|mdtext)$',
					configure: function(config){
					},
					setContent: function(page){
						$('.content').mustache('page-content-markdown', {content: page.getPageContent()});
						new EpicEditor({
							textarea: 'content',
							container: 'markdown-editor',
							basePath: '{{ site.baseurl }}/stevJs/epiceditor',
							autogrow: true
						}).load();
					},
					getContent: function(){
						return $('#content').val();
					}
				},
				{
					name: 'image',
					regex: '^.+\.(png|jpg|gif|ico|jpeg)$',
					configure: function(config){
					},
					setContent: function(page){
						$('.content').mustache('page-content-image', {
							repo: Stevenson.Account.repo,
							branch: Stevenson.Account.branch,
							path: page.path,
							date: new Date().getTime()
						});
						$('#upload-file-input').change(function(){
							Stevenson.ui.Loader.display("Uploading file...");
							var reader = new FileReader();
							reader.onload = function(e) {
								page.content =  reader.result;
								Stevenson.ui.Messages.displayMessage("File uploaded successfully");
								Stevenson.ui.Loader.hide();
							};
							reader.readAsArrayBuffer(document.getElementById('upload-file-input').files[0]);
						});
					},
					getContent: function(page){
						return page.content;
					}
				},
				{
					name: 'binary',
					regex: '.+',
					configure: function(config){
					},
					setContent: function(page){
						$('.content').mustache('page-content-binary', {
							repo: Stevenson.Account.repo,
							branch: Stevenson.Account.branch,
							path: page.path
						});
						$('#upload-file-input').change(function(){
							Stevenson.ui.Loader.show("Uploading file...");
							var reader = new FileReader();
							reader.onload = function(e) {
								page.content = reader.result;
								Stevenson.ui.Messages.displayMessage("Successfully uploaded file "+name);
								Stevenson.ui.Loader.hide();
							};
							reader.readAsBinaryString(document.getElementById('upload-file-input').files[0]);
						});
					},
					getContent: function(page){
						return page.content;
					}
				}

			]
		},
		/**
		 * Handles the the display and updating of the properties.
		 */
		Editor : {
			load : function(config, properties) {
				$('.fields').html('');
				$('.properties > legend').html(config.title);
				$('.properties > p').html(config.description);
				$.each(config.fields, function(idx, field){
					if(Stevenson.ui.Editor.types[field.type]) {
						Stevenson.log.debug('Loading field '+field.name+' of type '+ field.type);
						$('.properties .fields').append('<div class="control-group" id="field-'+idx+'"></div>');
						if(field.label){
							$('#field-'+idx).append('<label class="control-label" for="'+field.name+'">'+field.label+'</label>');
						}
						Stevenson.ui.Editor.types[field.type].load($('#field-'+idx), field, properties);
						if(field.help){
							$('#field-'+idx).append('<p class="help-block">'+field.help+'</p>');
						}
					} else {
						Stevenson.ui.Messages.displayError('Unable to find editor for: '
								+ field.type);
					}
				});
			},
			save : function(config, properties){
				var succeeded = true;
				for(var i=0;i<config.fields.length;i++){
					var field = config.fields[i];
					if(Stevenson.ui.Editor.types[field.type]) {
						Stevenson.log.debug('Saving field '+field.name+' of type '+ field.type);
						Stevenson.ui.Editor.types[field.type].save(field, properties);
						if(field.required 
								&& (!properties.hasOwnProperty(field.name) || properties[field.name] == '')){
							Stevenson.ui.Messages.displayError('Please fill out required field '+field.label);
							succeeded = false;
						}
					} else {
						Stevenson.ui.Messages.displayError('Unable to find editor for: '
								+ field.type);
					}
				}
				return succeeded;
			},
			types : {
				checkbox: {
					load: function(container, field, properties){
						var checked = (properties[field.name] === true);
						if(field.value === true && !properties.hasOwnProperty(field.name)){
							checked = true;
						}
						var html = '<div class="controls"><input type="checkbox" name="'+field.name+'" ' + (checked ? 'checked="checked"' : '') + ' /></div>';
						container.append(html);
					},
					save: function(field, properties){
						properties[field.name] = $('input[name='+field.name+']').is(':checked');
					}
				},
				date: {
					load: function(container, field, properties){
						var value = '';
						if(properties[field.name]){
							value = properties[field.name];
						} else if(field.value){
							value = field.value;
						}
						var html = '<div class="controls"><input type="datetime-local" name="'+field.name+'" ';
						if(field.required){
							html+='required="required"';
						}
						html+='/></div>';
						container.append(html);
						if(value && value != "" ){
							if (!(value instanceof Date)){
								value = new Date(value);
							}
							$('input[name='+field.name+']').val(value.toISOString().substring(0,19));
						}
					},
					save: function(field, properties){
						var value = $('input[name='+field.name+']').val();
						if (value == '' && properties[field.name]) {
							delete properties[field.name];
						} else if (value != '') {
							properties[field.name] = new Date(new Date(value).getTime()+new Date().getTimezoneOffset()*60000);
						}
					}
				},
				path: {
					load: function(container, field, properties){
						var value = '';
						if(properties[field.name]){
							value = properties[field.name];
						} else if(field.value){
							value = field.value;
						}
						var html = '<div class="controls"><input type="text" name="'+field.name+'" value="'+value+'" ';
						if(field.required){
							html+='required="required"';
						}
						html+='/>';
						Stevenson.repo.getAllFiles({
							path: '',
							success: function(files){
								var filtered = [];
								$.each(files,function(index, file){
									if(!(field.filter) || file.match(field.filter)){
										filtered.push('/'+file);
									}
								});
								$('input[name='+field.name+']').typeahead({
									source: filtered
								});
							}
						});
						container.append(html);
					},
					save: function(field, properties){
						var value = $('input[name='+field.name+']').val();
						if (value == '' && properties[field.name]) {
							delete properties[field.name];
						} else if (value != '') {
							properties[field.name] = value;
						}
					}
				},
				number: {
					load: function(container, field, properties){
						var value = '';
						if(properties[field.name]){
							value = properties[field.name];
						} else if(field.value){
							value = field.value;
						}
						var html = '<div class="controls"><input type="number" name="'+field.name+'" value="'+value+'" ';
						if(field.required){
							html+='required="required"';
						}
						html+='/></div>';
						container.append(html);
					},
					save: function(field, properties){
						var value = $('input[name='+field.name+']').val();
						if (value == '' && properties[field.name]) {
							delete properties[field.name];
						} else if (value != '') {
							properties[field.name] = value;
						}
					}
				},
				repeating: {
					addItem: function(container){
						var count = parseInt(container.attr('data-count')) + 1;
						var name = container.attr('data-name');
						var html = '<div id="'+name+'-value-'+count+'">';
						html+='<input type="text" name="'+name+'" required="required" />';
						html+='<a href="#" class="btn" value="-" onclick="$(\'#'+name+'-value-'+count+'\').remove();return false">-</a></div>';
						container.append(html);
						container.attr('data-count', count);
					},
					load: function(container, field, properties){
						var controls = $(container.append('<div class="controls"></div>').find('.controls')[0]);
						var values = $(controls.append('<div class="values" data-name="'+field.name+'"></div>').find('.values')[0]);
						var count = 0;
						if($.isArray(properties[field.name])){
							$.each(properties[field.name], function(index, val){
								var html = '<div id="'+field.name+'-value-'+index+'">';
								html+='<input type="text" name="'+field.name+'" value="'+val+'" required="required" />';
								html+='<a href="#" class="btn" tabindex = "-1" onclick="$(\'#'+field.name+'-value-'+index+'\').remove();return false;">-</a></div>';
								values.append(html);
								count++;
							});
						}
						$(container.find('.values')[0]).attr('data-count', count);
						controls.append('<br/><a href="#" class="btn" onclick="Stevenson.ui.Editor.types.repeating.addItem($($(this).parent().find(\'.values\')[0]));return false;">+</a>');
					},
					save: function(field, properties, id){
						var values = [];
						var inputs = $('input[name='+field.name+']');
						for(idx = 0; idx < inputs.length; idx++){
							values[idx] = $(inputs[idx]).val();
						}
						if (values.length == 0 && properties[field.name]) {
							delete properties[field.name];
						} else if (values != []) {
							properties[field.name] = values;
						}
					}
				},
				select: {
					load: function(container, field, properties){
						var value = '';
						if(properties[field.name]){
							value = properties[field.name];
						} else if(field.value){
							value = field.value;
						}
						var html = '<div class="controls"><select name="'+field.name+'" ';
						if(field.required){
							html+='required="required"';
						}
                        html+=">";
                        $.each(field.options, function(idx,elem){
                            if(value == elem){
                                html+='<option selected="selected">'+elem+"</option>";
                            } else {
                                html+='<option>'+elem+"</option>";
                            }
                        });
						html+='</select></div>';
						container.append(html);
					},
					save: function(field, properties){
						var value = $('select[name='+field.name+']').val();
						if (value == '' && properties[field.name]) {
							delete properties[field.name];
						} else if (value != '') {
							properties[field.name] = value;
						}
					}
				},
				text: {
					load: function(container, field, properties){
						var value = '';
						if(properties[field.name]){
							value = properties[field.name];
						} else if(field.value){
							value = field.value;
						}
						var html = '<div class="controls"><input type="text" name="'+field.name+'" value="'+value+'" ';
						if(field.required){
							html+='required="required"';
						}
						html+='/></div>';
						container.append(html);
					},
					save: function(field, properties){
						var value = $('input[name='+field.name+']').val();
						if (value == '' && properties[field.name]) {
							delete properties[field.name];
						} else if (value != '') {
							properties[field.name] = value;
						}
					}
				},
				textarea: {
					load: function(container, field, properties){
						var value = '';
						if(properties[field.name]){
							value = properties[field.name];
						} else if(field.value){
							value = field.value;
						}
						var html = '<div class="controls"><textarea name="'+field.name+'" ';
						if(field.required){
							html+='required="required"';
						}
						html+='>'+value+'</textarea></div>';
						container.append(html);
					},
					save: function(field, properties, id){
						var value = $('textarea[name='+field.name+']').val();
						if (value == '' && properties[field.name]) {
							delete properties[field.name];
						} else if (value != '') {
							properties[field.name] = value;
						}
					}
				}
			}
		},
		/**
		 * Handles messages to be displayed to the user.
		 */
		Messages : {
			/**
			 * Display a message to the user
			 */
			displayMessage : function(message) {
				var div = document.createElement("div");
				$(div).html(message);
				$(div).attr('class', 'alert alert-info');
				$('#message-container').append(div);
				$(div).delay(10000).slideUp(400);
			},
			/**
			 * Display an error to the user
			 */
			displayError : function(message) {
				var div = document.createElement("div");
				$(div).html(message);
				$(div).attr('class', 'alert alert-error');
				$('#message-container').append(div);
				$(div).delay(10000).slideUp(400);
			}
		},
		Loader : {
			display : function(message, progress) {
				$('#loading-modal .message').html(message);
				$('#loading-modal .bar').css('width', progress + '%');
				$('#loading-modal').modal({
					backdrop: 'static',
					keyboard: false,
					show: true
				});
			},
			hide : function() {
				$('#loading-modal .message').html('');
				$('#loading-modal .bar').css('width', '0%');
				$('#loading-modal').modal('hide');
			},
			update : function(progress) {
				$('#loading-modal .bar').css('width', progress + '%');
			}
		}
	},
	util: {
		getParameter: function(name){
			// perform all non-document loading here
			var value = '';
			if (window.location.href.indexOf('?') != -1) {
				var qs = window.location.href.split('?')[1].split('#')[0].split('&');
				for ( var i = qs.length - 1; i >= 0; i--) {
					var elem = qs[i].split('=');
					if(elem[0] == name){
						value = elem[1];
						break;
					}
				}
			}
			return value;
		}
	}
};
function Page(path, content) {
	this.path = path;
	this.content = content;
	this.isPost = function() {
		return path.indexOf('_posts') == 0;
	};
	this.getDate = function() {
		if (this.isPost()) {
			var properties = this.getProperties();
			if(properties.date) {
				var parts = properties.date.split('-');
				return new Date(parts[0], parts[1], parts[2]);
			} else {
				return this.getURLDate();
			}
		} else {
			Stevenson.log.warn("Called getDate on non-post");
			return null;
		}
	};
	this.getName = function() {
		var name = this.path.substring(this.path.lastIndexOf("/", 0));
		if (this.isPost()) {
			var parts = name.split('-');
			parts.reverse();
			parts.pop();
			parts.pop();
			parts.pop();
			parts.reverse();
			name = parts.join('-');
		}
		name = name.substring(0,name.lastIndexOf('.'));
		return name;
	};
	this.getPageContent = function(){
		var parts = this.content.split('---');
		if(parts.length == 3){
			return parts[2];
		} else {
			return parts[0];
		}
	};
	this.getProperties = function() {
		try{
			var parts = this.content.split('---');
			if(parts.length == 3){
				return YAML.parse(parts[1]);
			} else {
				Stevenson.log.warn('No YAML header found');
			}
		}catch(e){
			Stevenson.log.warn('Exception getting YAML Headers: '+e.message);
		}
	};
	this.getType = function() {
		return this.path.substring(this.path.lastIndexOf('.') + 1);
	};
	this.getURLDate = function() {
		if (this.isPost()) {
			var name = this.path.substring(this.path.lastIndexOf("/") + 1);
			var parts = name.split('-');
			return new Date(parts[0], parts[1], parts[2]);
		} else {
			Stevenson.log.warn("Called getDate on non-post");
			return null;
		}
	};
}
$(document).ready(function(){
	Stevenson.init();
});
