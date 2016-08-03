#  Pauá External Model and CohortEx:  

Paúa (means large in extension, broad, in Tupí-Guaraní language) is an external model upon which the logical model  of an Electronic Health Record system can be mapped to extract data and statistically analize it with R.

Studies are defined by parameters stored as insert statements on a sql script that creates a parameter table. 
This script is stored in a versioned repository (Github) and run before the cohort selection script. 
A user friendly serverless tool that runs on a browser as an html page (gh-pages branch of the same Github repository) and edits a json version of the parameters that define the selected cohort that are converted to insert statements and stored on the repository, as a new version of the parameters table. 
Shiny will be a nice addition to make the same edition of parameters for the R scripts. Both scripts  (SQL and R) are intended to be run by a simple Continuous Integration (CI) Server (like Jenkins) behind the institution, triggered by a request of a researcher, that forked the original repository and stated on it his study parameters, sending the repository address and version number. 
The CI Server peaks the scripts from the repository and runs over the EHR database returning the results to the email of the sender. This way we ensure a repeatable process and references to the original work with means it is easy to check modifications made to the original scripts. 
Even more, as collaboration evolves, changes can be pushed to the original repository to enhance studies. We have limited resources (time and man power) to put everything on place right now, but we are committed to do so and really understand that this way we are paving our road to a better understanding of large solutions as OMOP model which is indeed the right way to go.

Pauá external model is described in detail in [Tereza] paper.  

Here you find the following files:  

  - CohortExScript.sql  
  - CohortExAnalysis.rmd
  - CohortExAnalysis.html
  - pauaModel.png
  

##### CohortExScript.sql:
This sql script is made enterly of views and targeted initially for Oracle, but aims to be easly ported to other sql flavors. Most of it is ANSI SQL, create materialized views statetments are used as a form to obtain performance but can be changed to create tables to use in other DBMS without materialized views facilities.  
The script first drops all views and then recreates them which ends selecting the data. It expects just the Pauá external model views to be already present before it runs, so you must implement the mapping between your EHR tables and the Pauá views.
##### CohortExAnalysis.rmd
This is a R markdown script that runs after sql script and realizes the statistical analysis. At the end, am html or pdf file with result is made available.  
##### CohortExAnalysis.html
The results of a cohort selection and analysis of DCV patients as described in the paper.
##### pauaModel.png
A diagram of relationships between views and materialized views that conform the Pauá model to better understand the queries.
### How to run:
You need to setup a server with an account and an schema with access to the EHR's database and enough permissions to create tables, views and materialized views. Server may be any PC (any OS) setup to run:  
 - RStudio
 - JenkinsCI
 
### How to edit prameters:
Parameters that define the study are stored as insert sql commands in a group of tables. That's not user friendly, so a kindly tool is in development to help a researcher to easly define study parameters.
This tool is a serverless web application hosted in GitHub gs-pages branch of this repository.

You can access it at [<your_login_name>.github.io/CohortEx](http://mtfa.github.io/CohortEx) .
