const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

const helper = require('../app/js/common.js');

const INFO = function(msg){ return chalk.blueBright(msg); }
const PROCESS = function(msg){ return chalk.magentaBright(msg); }
const WARNING = function(msg){ return chalk.yellowBright(msg); }
const ERROR = function(msg){ return chalk.redBright(msg); }
const BOLD = function(msg){ return chalk.bold(msg); }

const DEFAULT_FLAGS = ['json', '-u', '-i'];

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("skipIntro", { type: Boolean, required: false });
    this.argument("command", { type: String, required: false });
  }

initializing() {
  // register auto complete questions types
  this.env.adapter.promptModule.registerPrompt("autocomplete", require("inquirer-autocomplete-prompt"));
  this.env.adapter.promptModule.registerPrompt("checkbox-plus", require("inquirer-checkbox-plus-prompt"));
  this.env.adapter.promptModule.registerPrompt('filePath', require('inquirer-file-path'));
  this.env.adapter.promptModule.registerPrompt('directory', require('inquirer-directory'));

 
  if(this.options.command)
  this.log('Commands so far :\n' + this.options.command);

  // getting all SFDX commands
  let sfdxCommandsOutput = helper.getSFDXCommands();
  // mapping the commands into question options
  if(sfdxCommandsOutput.code === 0){
    this.sfdxCommands = sfdxCommandsOutput.result.map( command =>({ name :command.id, 
                                                                    value: command.id , 
                                                                    output: command }));
    this.sfdxOrgs = helper.getOrgs();       
    this.log( yosay(  this.sfdxOrgs.yosay ));                                                 
  }
  else {
    this.log(`ERROR ${ ERROR(sfdxCommandsOutput.result ) }`);
  }
    
}


prompting() { 
  
    

    const allOrgs = [...this.sfdxOrgs.scratchOrgs, ...this.sfdxOrgs.nonScratchOrgs]; 
    
    const self = this;  
    // allow to select and autocomplete any SFDX command     
    const commandsQuestion = [
            {
            type: 'autocomplete',
            name: 'commandName',
            suggestOnly: false,
            message: PROCESS('Choose a Command : '),
            source: function(answers, input){
              return helper.searchByKey(input, self.sfdxCommands,'value');
            },
            pageSize: 5,
            validate: function(val) {
              let found = self.sfdxCommands.some(item => item.value == val);
              return found ? true : val +' Was not found in commands ';
            },
          },
    ];
    
    // will store the command publicly 
    this.props = {
      commandDescribe : { },
      flags : [],
      selectedFlags: [],
      selectedOrg :{},
      runCommand : ''
    };
 
    // prompt select SFDX command from all commands
    return this.prompt(commandsQuestion).then((answers) => {
       const selectedCommand = this.sfdxCommands.find(command =>  command.value == answers.commandName);
   
        // store selected command describe
        this.props.commandDescribe = helper.getCommandDescribe( selectedCommand , DEFAULT_FLAGS);
        // find the selected command object
        const commandDetails = this.props.commandDescribe.details;

      // display details
        this.log(chalk.cyanBright('COMMAND \n'));
        this.log( chalk `{bold ${commandDetails.id} }\n`);
      // show description of the command
      if(commandDetails.description) {
          this.log(chalk.cyanBright('DESCRIPTION \n'));
          this.log(commandDetails.description + '  \n ... ');
      }
      this.log(`-------------------------------------------`);
      // show some examples if exists
      if( commandDetails.examples ){
          this.log( chalk.cyanBright('EXAMPLES \n') );
          commandDetails.examples.forEach( item => {
            this.log(item);
          });
      }
      this.log(`-------------------------------------------`);

       // write to commands log file 
      const commandProcessQuestions =  [{
        type: 'confirm',
        name: 'writeCommand',  
        message: ERROR('Store command for automation process'),
        default: true
      },
      {
        type: 'input',
        name: 'aliasName',  
        message: ERROR('command alias name'),
        when: function(answers){
          return answers.writeCommand;
        },
        validate: function(value){
          return value ? true : 'give the command a name';
        }
      },
      {
        type: 'input',
        name: 'commandOutputFile',  
        message: ERROR('commands output file name'),
        default: 'commands.json',
        filter:function(fileName) {
          fileName = fileName.indexOf('.json') === 0 ? fileName : fileName + '.json';
          return fileName;
        },
        when: function(answers){
          return answers.writeCommand;
        },
        validate: function(value){
          return value ? true : 'give the command a name';
        }
      }];
      // allow to multi select an options for flags to later on create questions for values
      const selectedFlagsQuestion = [ {
          type: 'checkbox-plus',
          name: 'selectedFlags',
          message: PROCESS('Select flags'),
          pageSize: 5,
          highlight: true,
          searchable: true,
          default: this.props.commandDescribe.defaultFlags,
          validate: function(choices) {
            if (choices.length == 0) {
              return 'You must choose at least one flag.';
            }
            return true;
          },
          source: function(answersSoFar, input){
            return helper.searchByKey( input, self.props.commandDescribe.relatedFlags);
          }
        },
        // TODO: add filter between scratch,org,all 
        {
          type: 'autocomplete',
          name: 'orgName',
          message: 'target Org',
          pageSize: 5,
          suggestOnly: false,
          default: this.sfdxOrgs.defaultScratchOrg.value,
          validate: function(val) {
            return val ? true : ' Must have an alias name ';
          },
          when: function(answers) {
            return answers.selectedFlags.includes('-u');
          },
          source: function(answers, input){
            // priority flag for search in orgs
              if(answers.selectedFlags.includes('-u'))
              return helper.searchByKey(input, allOrgs, 'name');
            }
        }
      ];

      const commandDetailsQuestions = [...selectedFlagsQuestion, ...commandProcessQuestions];
        // prompt flags options
        return this.prompt(commandDetailsQuestions).then((answers) => {
          // getting org describe and default
          if(answers.orgName){
            this.props.selectedOrg = allOrgs.find(item => item.value == answers.orgName);
            // adding the flag to the command
            this.props.flags.push({ name: '-u', value: this.props.selectedOrg.value });
            this.log('selectedORG ' + this.props.selectedOrg.name);
          }
        

          // write commands for automation process
          this.props.writeCommand = answers.writeCommand;
          this.props.aliasName = answers.aliasName;
          this.props.commandOutputFile = answers.commandOutputFile;
          this.props.orgsDetails = {};

          // get flags details and divide by logic
          this.props.selectedFlags = this.props.commandDescribe.relatedFlags.filter( item => answers.selectedFlags.includes(item.value) );
          // exclude flags from this step
          const excludeFlags = ['-u', 'values'];
          const filteredFlags = this.props.selectedFlags.filter( item => !excludeFlags.includes(item.value) && !excludeFlags.includes(item.short) );
        
          // Data questions
          const isSObject = this.props.selectedFlags.some(flag => flag.short == 'sobjecttype');
          
          let allSObject = [];
          if(isSObject){
              allSObject = helper.getSchema(this.props.selectedOrg.value);
          }
            //create initial questions from flags
          let selectedFlagsQuestions = helper.createQuestions(filteredFlags, allSObject);
          
       
          // prompt questions for each flag option
          return this.prompt(selectedFlagsQuestions).then((answers) => {

            this.props.selectedFlags.forEach(flag => {
              // when question value match the flag value
              if( answers[flag.value] ){
                this.props.flags.push({ name: flag.value, value: answers[flag.value] });
              }
            });
          
              // priority questions
              const isTargetOrg = this.props.selectedFlags.some(flag => flag.value == '-u');
              const isDevHub  = this.props.selectedFlags.some(flag => flag.short == 'targetdevhubusername');
              
             
              if( answers['-s'] ) {

                const selectedSObject = helper.getSObjectDescribe(answers['-s'], this.props.selectedOrg.value, answers['-t']);
                // store sobject name
                this.sObjectName = selectedSObject.name;
                // define fields options based on command
                let fieldOptions = [];
                if(this.props.commandDescribe.name.indexOf('force:data:record:create') === -1 ) {
                  fieldOptions = selectedSObject.fields.filter(field => field.createable);
                }
                else {
                  fieldOptions = selectedSObject.fields.filter(field => field.updateable);
                }

                const externalIdFields = selectedSObject.fields.filter(field => field.externalId || field.name == 'Id');
                // TODO : UPSERT handler with external Id
                // TODO : check if needed as well on flag '-w' for where clause
                this.isValues = this.props.selectedFlags.some(flag => flag.short == 'values');
                // this is only when needed to populate fields with values
                if(this.isValues) {
                    // fields autocomplete menu from sObject
                    const fieldsQuestions = [{
                      type: 'checkbox-plus',
                      name: 'fieldsMenu',
                      message: 'Select Fields from '+ selectedSObject.name,
                      pageSize: 5,
                      highlight: true,
                      searchable: true,
                      validate: function(choices) {
                        return choices.length > 0 ? true : chalk.redBright('Must Select at least one option');
                      },
                      source: function(answersSoFar, input){
                        return helper.searchByKey( input, fieldOptions, 'name');
                      }
                    }];
                
                    // adding fields inputs based on what selected
                    fieldOptions.forEach( field => {
                      const fieldInput = {
                        type: "input",
                        name: field.value,
                        message: WARNING(field.value) + " = ",
                        when: function(answers) {
                          return answers.fieldsMenu.includes(field.value);
                        }
                      };
                      fieldsQuestions.push(fieldInput);
                    });
                    // obtained all field values now process and store them
                    return this.prompt(fieldsQuestions).then((answers) => {

                          let fieldsValues = []; 
                        
                          for(const input in answers) {
                            if(answers.hasOwnProperty(input)) {
                              if(answers.fieldsMenu.includes(input)) {
                                if(answers[input])
                                fieldsValues.push(input +'=\'' +answers[input] +'\'');
                              }
                            }
                          }
                          // store sobject values
                          const sObjectValues = fieldsValues.join(" ");
                          // add flag -v
                          this.props.flags.push({ name :'-v', value : sObjectValues });

                    });
                }
              }

            });
         
        });
      });
  }

  configuring() {
     // building the command
     let commandText = ` sfdx ${this.props.commandDescribe.name}`;

     if(this.props.flags && this.props.selectedFlags){
      this.props.flags.forEach(flag => {
        // when question value match the flag value
        const flagDetails = this.props.selectedFlags.find( item => item.value == flag.name);
          // TODO: check if needed quotes on files
          if( flagDetails.type == 'option' )
            commandText += ` ${flag.name} \"${flag.value}\"`;
          // will add booleans values when true
          else if( flagDetails.type == 'boolean' && flag.value )
            commandText += ` ${flag.name}`;
        
        });
           
      }   
      this.props.runCommand = commandText;
  }

  writing() {
  
    if(this.props.writeCommand) {
      this.log('write ' + this.props.writeCommand);
      let commands = [];
      let commandsPath = this.destinationPath() + '/'+ this.props.commandOutputFile;
      // check if file exists
      if(this.fs.exists(commandsPath)) {
        commands = this.fs.readJSON(commandsPath);
      }
      commands.push({ value: this.props.runCommand,
                      name :  `${ERROR(this.props.aliasName)} - ${this.props.runCommand}`
                    });
     
      this.log('stored : \n' + JSON.stringify(commands));
      this.fs.writeJSON(commandsPath, commands);
    }
    else {
      this.log(WARNING(` will run : \n  ${this.props.runCommand}`));
      const runOutput = helper.runSFDXCommand(this.props.runCommand);
      if(runOutput.code === 0){
        this.composeWith(require.resolve('../write'),{
          output : runOutput
        });
      }
    }
   }

  end() {
   
      this.composeWith(require.resolve('../app'),{
        command : this.props.runCommand
      });
    
  
  }



};
