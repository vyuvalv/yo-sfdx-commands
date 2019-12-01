## SFDX with YO Command 

**LOCAL YEOMAN GENERATOR**  
`generator-cmd >> yo cmd`
***************************************

> * **YEOMAN SFDX Generator with AUTO COMPLETE**  
    - This will allow faster typing of SFDX commands  
    - Rely on `"sfdx commands --json"` command in order to generate the options as auto-complete  
    - Simply Type  `yo [generator name]`  and yeoman will walk you through the command you wish to invoke  
    - will auto-complete force:org commands with real time org details
    - will auto-complete force:data commands with schema options

**DEMO**  

![DEMO](generatorGif.gif)

## Workflow Overview

* This will allow to auto-complete any SFDX command

### Generator Paths
* `yo cmd` - will show the first prompt question

>### Search and auto-complete the SFDX command you will write
```
⣾ getting sfdx commands...
✔ all SFDX commands were pulled successfully
? Choose a Command :  (Use arrow keys or type to search)
❯ commands 
  force:alias:list 
  force:alias:set 
  force:apex:class:create 
  force:apex:execute 
(Move up and down to reveal more choices)
```

  
_______________________________________

## SFDX Commands in use 

* `sfdx commands`  

***************************************

## Installation

Few simple steps, install [Yeoman](http://yeoman.io) (we assume you have pre-installed [node.js](https://nodejs.org/) and [sfdx cli](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm) ).  


1. Install SFDX
```npm
   npm install sfdx-cli --global
```
2. Install Yo
```npm
   npm install -g yo
```

3. Clone this repository

4. Rename the git folder to `generator-cmd` or whatever you wish to call it.  
    -- just make sure to change the `project.json` file accordingly and step inside it
```npm
    mv [sourceFolder] [targetName] // to rename the folder as the generator named
    cd generator-cmd
```
5. Once finished editing the `project.json` file link required npm modules  
```npm
  npm link
```


Then call your new workflow generator with:

```bash
  yo cmd
```


 Feel Free to build your own Generator using the generator for generators  
 `npm install -g yo generator-generator`

***************************************


## Getting To Know Yeoman

 * Yeoman has a heart of gold.
 * Yeoman is a person with feelings and opinions, but is very easy to work with.
 * Yeoman can be too opinionated at times but is easily convinced not to be.
 * Feel free to [learn more about Yeoman](http://yeoman.io/).


## Dependencies in Use
<details>
<summary><a href="https://github.com/yeoman/yosay" target="_blank"> yosay </a>  - Tell Yo to Say Hello
</summary>
<pre>
    details:
      - description: yosay will tell yo what to say using yeoman ASCII image
        sample:  this.log( yosay( 'Hello World' );
</pre>
</details>

<details>
<summary> 
    <a href="https://github.com/chalk/chalk" target="_blank"> chalk.js </a> - Give some colour
</summary>
<pre>
    details:
      - description: Will allow to add colours to the input/output
        sample:  this.log( chalk.redBright.underline('Hello World') );
</pre>
</details>


<details>
<summary> 
    <a href="https://github.com/shelljs/shelljs" target="_blank"> shelljs </a> -  Unix shell commands on top of the Node.js API
</summary>
<pre>
    details:
      - description: Will allow to run shell commands
        examples:  
        // get the output of the command silently 
        - shell.exec(' sfdx force:org:list --json', { silent: true } )
            -- .stdout // output
            -- .stderr // error
            -- .code // code ( 0 : SUCCESS )
        // get list of directories in folder
        -  const folders = shell.ls('-L',this.destinationPath() );

        - <a href="https://devhints.io/shelljs" target="_blank"> shelljs </a> - cheat sheet
</pre>
</details>

<details>
<summary> 
    <a href="https://github.com/sindresorhus/ora" target="_blank"> ora </a> - Elegant terminal spinner
</summary>
<pre>
    details:
      - description: Will allow to show a spinner for running process
      require : 
        - const spinner = require('ora');
      sample: 
      // Start loading spinner
      this.loading = new spinner(
        { spinner:'dots',
          color : 'yellow' }
      ).start('Start Spinning...');
      // Success 
      - this.loading.succeed('Successfully loaded');
      // Failure 
      - this.loading.fail('Failed to load');
</pre>
</details>
<details>
<summary> 
    <a href="https://github.com/mokkabonna/inquirer-autocomplete-prompt" target="_blank"> inquirer-autocomplete-prompt </a> - A plugin for Inquirer that allows autocomplete select prompt.
</summary>
<pre>
const fuzzy = require('fuzzy');

initializing() {
   this.env.adapter.promptModule.registerPrompt("autocomplete", require("inquirer-autocomplete-prompt"));
}

prompting() {
    const colors = [
            { name : 'red', value : 'red'},
            { name : 'blue', value : 'blue'},
            { name : 'green', value : 'green'},
            ];
    this.props = {};
    return this.prompt( [ {
                            type: 'autocomplete',
                            name: 'color',
                            message: 'Select a state to travel from',
                            source: function(answersSoFar, input) {
                                input = input || '';
                                return new Promise(function(resolve) {
                                    var fuzzyResult = fuzzy.filter(input, colors, {
                                    extract: function(item) {
                                        return item['name'];
                                    }
                                    });
                                var data = fuzzyResult.map(function(element) {
                                return element.original;
                                });
                            resolve(data);
                            });
                    })].then((answers) => { 
                        this.props = answers.color;
                        // etc
                    });
  }
}

</pre>
</details>


<details>
<summary> 
    <a href="https://github.com/faressoft/inquirer-checkbox-plus-prompt" target="_blank"> inquirer-checkbox-plus-prompt </a> - A plugin for Inquirer that allows multi select with autocomplete.
</summary>
<pre>
const fuzzy = require('fuzzy');

initializing() {
  this.env.adapter.promptModule.registerPrompt("checkbox-plus", require("inquirer-checkbox-plus-prompt"));
}

prompting() {
    const colors = [
            { name : 'red', value : 'red'},
            { name : 'blue', value : 'blue'},
            { name : 'green', value : 'green'},
            ];
    this.props = {};
    return this.prompt( [ {
          type: 'checkbox-plus',
          name: 'colors',
          message: 'Select color',
          pageSize: 5,
          highlight: true,
          searchable: true,
          default: ['red','blue'],
          validate: function(answer) {
            return answer.length != 0 ? true : 'You must choose at least one color.';
            },
          source: function(answersSoFar, input) {
                input = input || '';
                return new Promise(function(resolve) {
                    var fuzzyResult = fuzzy.filter(input, colors, {
                    extract: function(item) {
                        return item['name'];
                    }
                    });

                    var data = fuzzyResult.map(function(element) {
                    return element.original;
                    });
                resolve(data);
                });
        })].then((answers) => { 
            this.props = answers.colors;
        });
  }
}

</pre>
</details>


<details>
<summary> 
    <a href="https://github.com/SBoudrias/Inquirer.js" target="_blank"> Inquirer.js </a> - Dynamic questions and validation of prompt questions
</summary>
<pre>
    details:
      - description: Will allow to add logic to questions
        sample: 
        const questions = [{
        type: 'checkbox',
        name: 'mainMenu',
        message: 'What would you like to do ?',
        validate: function(choices) {
          return choices.length > 0 ? true : chalk.redBright('Must Select at least one option');
        },
        choices: [
          {
            type: 'separator', 
            line:'-˯-˯-˯-˯-˯-˯-˯'
          },
          {
            name:  'New Project',
            value: 'create-project' ,
            checked: false
          },
          {
            name:  'New Scratch Org',
            value:  'create-org',
            checked: false
          },
          {
            type: 'separator', 
            line: '-^-^-^-^-^-^-^'
          }
        ]
      },
      {
        type: "input",
        name: "inputName",
        message: "Please give a name to your project : "),
        default:'Yuval',
        when: function(answers) {
          return answers.mainMenu.includes("create-project");
        },
        validate: function(value) {
          return value ? true : 'Please enter a name';
        }
      }
      ];
</pre>
</details>


<details>
<summary> 
    <a href="https://github.com/SBoudrias/mem-fs-editor" target="_blank"> mem-fs-editor </a> - helpers working on top of mem-fs
</summary>
<pre>
    details:
      - description: Will allow to access file system
        sample: 
        // read file as Json object
        - this.fs.readJSON('filePath');
        // check if file path exists
        - this.fs.exists('filePath');
        // delete file
        - this.fs.delete('filePath');
</pre>
</details>


