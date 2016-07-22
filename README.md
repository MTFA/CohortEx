#  Pauá External Model and CohortEx:  

Paúa (means large in extension, broad, in Tupí-Guaraní) is an external model upon which the Electronic Health Record system logical model can be mapped to extract data and statistically analize it with R.
Pauá external model is described in detail in [Tereza] paper.  
Here you find the following files:  
  - CohortExScript.sql  
  - CohortExScript.Rmd

##### CohortExScript.sql:
This sql script is made enterly of views and targeted initially for Oracle, but aims to be easly ported to other sql flavors. Most of it is ANSI SQL, create materialized views statetments are used as a form to obtain performance but can be changed to create tables to use in other DBMS without materialized views facilities.  
The script first drops all views and then recreates them which ends selecting the data. It expects just the Pauá external model views to be already present before it runs, so you must implement the mapping between your EHR tables and the Pauá views.
##### CohortExScript.Rmd
This is a R markdown script that runs after sql script and realizes the statistical analysis. At the end, am html or pdf file with result is made available.  
### How to run:
You need to setup a server with an account and an schema with access to the EHR's database and enough permissions to create tables, views and materialized views. Server may be any PC (any OS) setup to run:  
 - RStudio
 - JenkinsCI
 
### How to edit prameters:
Parameters that define the study are stored as insert sql commands in a group of tables. That's not user friendly, so a kindly tool is in development to help a researcher to easly define study parameters.
This tool is a serverless web application hosted in GitHub gs-pages branch of this repository.

You can access it at [<your_login_name>.github.io/CohortEx](http://pmadril.github.io/CohortEx) .
