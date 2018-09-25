#  Pauá External Model and CohortEx:  

Pauá (means large in extension, broad, in Tupí-Guaraní language) is an external model upon which the logical model  of an Electronic Health Record system can be mapped to extract data and statistically analize it with R.  
This model is detailed in the following paper: [A method for cohort selection of cardiovascular disease records from an electronic health record system](https://www.sciencedirect.com/science/article/pii/S138650561730076X)  
CohortEx, from Cohort Extraction, is the project that sums all the pieces to make a working model.

Here you find the following files:  
  - CohortExScript.sql    (the model, as a set of sql queries) 
  - CohortExAnalysis.rmd  (a sample R statistical analysis, which runs over the model)
  - CohortExAnalysis.html (the results of R script)
  - pauaModel.png         (a graphical view of the model, to better understand the set of queries)

This model supports parameterization, so differents studies can be made over Pauá model.
Parameters are stored as registers in a parameter table and as a json file (identified by .jctx extension) which follows a json schema (cohortexV1.0.0.json).
To edit parameters, there is the CohortEx Editor tool, a javascript application 
running as GitHub-Pages, with ablity to create/edit studies and blog pages.

So, you will also find here:
  - schemas/cohortexV1.0.0.json        (the schema which describes a jctx file)
  - studies/2017-01-12-DCV-Study.jctx  (a sample study parameters file)
  - docs/ folder                       (CohortEx Parameters Editor tool files)
  
Steps to use CohortEx:

  - ![Fork](docs/css/images/fork_small.png) this repository.  
    The CohortEx Editor only recognizes repositories forked from this one. 
  - Change the settings of the forked repository to run GitHub Pages on docs folder.  
    Refer to [configuring github-pages](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/#publishing-your-github-pages-site-from-a-docs-folder-on-your-master-branch) for more details.
  - Once GitHub deploys the site, access it in the URL pointed by GitHub 
    (something like: https://&lt;your_login_name&gt;.github.io/CohortEx). 

You will see a site with functions to edit or create new studies. 
Example: [http://mtfa.github.io/CohortEx](http://mtfa.github.io/CohortEx)

(Not ready yet): Once you publish your study, by setting the publish option during the study edition,  
it will be run over the database and you receive the results on your github email.

Learn how to personalize your fork and more on [![wiki](docs/css/images/wiki.png)](https://github.com/MTFA/CohortEx/wiki) pages.

[CohortEx Parameters Editor](https://github.com/pmadril/CohortExEditor) tool is a separate project, also licensed under Apache 2.0
