(function ($) {
    "use strict";
	var filterRepos = function (id) {
		var filter = $('#' + id + '-filter input').val().toLowerCase();
		if (filter === '') {
			$('.tab-pane#' + id + ' .repo').show();
		} else {
			$('.tab-pane#' + id + ' .repo').each(function (idx, elem) {
				if ($(elem).attr('id').toLowerCase().indexOf(filter) !== -1) {
					$(elem).show();
				} else {
					$(elem).hide();
				}
			});
		}
	},
        selectBranch = function () { //CohortExDev - selectBranch defines where to go
            Stevenson.Account.repo = $('#current-repo').html();
            Stevenson.Account.branch = $('#branches').val();
            Stevenson.Account.save();
            
			//CohortExDev - Go to studies folder on repo=master (was: /cms/site.html#)
			Stevenson.repo.getLayoutsAndSchemas({
                success: function (branches) {
					if (Stevenson.ext.type == 'study') {
                    	window.location = Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_siteStudies.html#' + Stevenson.Account.studiesPath ;
					} else {
                    	window.location = Stevenson.Account.siteBaseURL + '/cohortexCms/cohortex_sitePosts.html#' + Stevenson.Account.subFolder + '_posts' ;
					}
                },
                error: function (err) {
					Stevenson.ui.Messages.displayError('Unable to load layouts: '
                            + err);
                    Stevenson.ui.Messages.displayError('Unable to load schemas: '
                            + err);
                }
            });
            
            return false;
        },
        loadRepos = function (group) {
            Stevenson.ui.Loader.display('Loading repositories...', 100);
            Stevenson.log.info('Loading repositories for ' + group);
            Stevenson.repo.getRepos({
                group: group,
                success: function (repos) {
                    var container = $('.tab-content #mine'),
                        validRepo = false,
                        forksRepo = [],
                        forksCount = 0;

                    if (group) {
                        container = $('.tab-content #' + group);
                    }

                    $.each(repos, function (index, repo) {
                        var lastRepo = (index === repos.length - 1);
						//CohortExDev - Just accept repositories forked from forkRootName as parent
                        if (repo.fork === true) {
                            forksRepo.push(repo);
                        }
                        if (lastRepo === true) {
                            if (forksRepo.length > 0) {
                                forksCount = forksRepo.length;
                                forksRepo[forksRepo.length - 1].lastRepo = true;
								
								//CohortExDev - For each repo, built the intem (pencil and link)
                                $.each(forksRepo, function (index, forkedRepo) {
                                    Stevenson.repo.getRepo({
                                        name: forkedRepo.full_name,
                                        success: function (forkedRepo) {
                                            forksCount -= 1;
                                            if (forkedRepo.source.name === Stevenson.Account.forkRootName) {
                                                validRepo = true;
                                                container.mustache('repo-item', forkedRepo);

                                                Stevenson.ui.Loader.hide();
                                                container.find('a.open').click(function () {
                                                    Stevenson.ui.Loader.display('Loading branches...', 100);
                                                    var repo = $(this).attr('data-repo');
                                                    Stevenson.repo.getBranches({
                                                        repoName: repo,
                                                        success: function (branches) {
                                                            Stevenson.log.debug('Loaded branches: ' + branches);
                                                            $('#branches').html('');
                                                            $.each(branches, function (index, branch) {
                                                                $('#branches').append('<option value="' + branch + '">' + branch + '</option>');
                                                            });
                                                            $('#current-repo').html(repo);
															
															//CohortExDev -Force master branch unless there is no master branch
                                                            if (branches.length !== 1 && branches.indexOf('master') < 0) {
                                                                Stevenson.ui.Loader.hide();
                                                                $('#branch-modal').modal('show');
                                                            } else {
																if (branches.indexOf('master') > 0) {
																	$('#branches').val('master');
																}
																
																//CohortExDev - selectBranch defines where to go
                                                                selectBranch();
                                                            }
                                                        },
                                                        error: function (err) {
                                                            Stevenson.ui.Messages.displayError('Unable to load branches: '
                                                                + err);
                                                            Stevenson.ui.Loader.hide();
                                                        }
                                                    });
                                                    return false;
                                                });
                                            } else {
                                                if (forksCount === 0 && validRepo === false) {
                                                    Stevenson.ui.Messages.displayError('None of your repositories in this group is a direct or indirect fork from MTFA/CoortEx source ');
                                                    Stevenson.ui.Loader.hide();
                                                }
                                            }
                                        },
                                        error: function (message) {
                                            Stevenson.ui.Loader.hide();
                                            Stevenson.ui.Messages.displayError('Unable to load repositories: '
                                                    + message);
                                        }
                                    });
                                });
                            } else {
                                Stevenson.ui.Messages.displayError('None of your repositories in this group is a direct or indirect fork from MTFA/CohortEx source ');
                                Stevenson.ui.Loader.hide();
                            }

                        }
                    });
                },
                error: function (message) {
                    Stevenson.ui.Loader.hide();
					isLoading = false;
                    Stevenson.ui.Messages.displayError('Unable to load repositories: '
                            + message);
                }
            });
        };
	Stevenson.ext.afterInit(function () {
		
		//CohortExDev - Select if study or post
		Stevenson.ext.type = Stevenson.util.getParameter('type');
		if(Stevenson.ext.type == '') {
			Stevenson.ext.type = 'study';
		}
		//Set the corresponding title
		$('#select-title').html(Stevenson.ext.type);
		
		Stevenson.ui.Loader.display('Loading organizations...', 100);
		if (typeof Stevenson.Account.primaryEmail === 'undefined' || Stevenson.Account.primaryEmail == ''){
			Stevenson.repo.getEmails({
				success: function (emails) {
					$.each(emails, function (idxe, email) {
						if (email.primary === true){
							Stevenson.Account.primaryEmail = email.email;
						}
					});
				},
				error: function (message) {
					Stevenson.ui.Loader.hide();
					Stevenson.ui.Messages.displayError('Unable to find user email. '
							+ message);
				}
			});
		}
		Stevenson.repo.getOrgs({
			success: function (orgs) {
				$.each(orgs, function (idx, org) {
					$('.nav-tabs').append('<li><a href="#' + org.login + '">' + org.login + '</a></li>');
					$('.nav-tabs a[href=#' + org.login + ']').click(function () {
						if ($('.tab-pane#' + org.login).html() === '') {
							$('#' + org.login).mustache('org-header', org);
							loadRepos(org.login);
							var filterRepo = function () {
								filterRepos(org.login);
							};
							$('#' + org.login + '-filter input').change(filterRepo).keyup(filterRepo).click(filterRepo).focusout(filterRepo);
							$('#' + org.login + '-filter').submit(function () {
								return false;
							});
						}
						$(this).tab('show');
						return false;
					});
					$('.repos').append('<div class="tab-pane" id="' + org.login + '"></div>');
				});
				Stevenson.ui.Loader.hide();
				loadRepos();
				$('.nav-tabs a[href=#mine]').click(function () {
					$(this).tab('show');
					return false;
				});
			},
			error: function (message) {
				Stevenson.ui.Loader.hide();
				Stevenson.ui.Messages.displayError('Unable to load groups: '
						+ message);
			}
		});
		var user = Stevenson.session.get('user'),
            filterRepo = function () {
                filterRepos('mine');
            };
		$('#user-avatar').attr('src', user.avatar_url);
		$('#mine-filter input').change(filterRepo).keyup(filterRepo).click(filterRepo).focusout(filterRepo);
		
	});
	$(document).ready(function () {
		$('#branch-modal .btn').click(selectBranch);
	});
}(jQuery));
