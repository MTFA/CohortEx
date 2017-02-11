#  Pauá External Model and CohortEx:  

Paúa (means large in extension, broad, in Tupí-Guaraní language) is an external model upon which the logical model  of an Electronic Health Record system can be mapped to extract data and statistically analize it with R.

Studies are defined by parameters stored as insert statements on a sql script that creates a parameter table. 
This script is stored in a versioned repository (Github) and run before the cohort selection script. 

Pauá external model is described in detail in [Tereza] paper.  

Here you find the following files:  

  - CohortExScript.sql  
  - CohortExAnalysis.rmd
  - CohortExAnalysis.html
  - pauaModel.png
  - schemas/cohortexV1.0.0.json
  - studies/2017-01-12-DCV-Study.jctx
  - docs folder: CohortEx Parameters Editor's files
  
Steps to use CohortEx:

  - Fork this repository [Fork](https://ghbtns.com/github-btn.html?user=MTFA&repo=CohortEx&type=fork&count=true&size=large). 
  - Change the settings of the forked repository to run GitHub Pages on docs folder. 
  - Once GitHub deploys the site, access it in the URL pointed by GitHub. 

You will see a site with functions to edit or create new studies. 
You can also access the CohortEx Parameters Editor at https://<your_login_name>.github.io/CohortEx
Example: [http://mtfa.github.io/CohortEx](http://mtfa.github.io/CohortEx)

(Not ready yet): Once you publish your study, by clicking in the publish option, during the study edition, it will be run over the database and you receive the results on your github email.

Learn more on wiki pages.

