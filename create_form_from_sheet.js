function createGoogleForm(){

    const sheet_name = 'Problem Data';
    
    const cells = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet_name).getDataRange().getValues();
  
    const form_title = `${cells[2][1]}_${Math.random()}`;
    console.log(`Creating the form [ ${form_title} ]...`);
    const Form = FormApp.create(form_title);

    Form.setDescription(cells[3][1]);
    Form.setIsQuiz(true)

    const num_problems = cells[0][10];
    const problem_start_index = 7;

    for (let i = problem_start_index; i < problem_start_index + num_problems; ++i) {
        
        const problem_type  = cells[i][2];
        const problem_title = cells[i][4];
        const answer        = cells[i][5];

        if (problem_type == 'Short Answer') {

            Form.addTextItem().setTitle(problem_title);

        } else if (problem_type == 'Radio Button') {

            const radio   = Form.addMultipleChoiceItem().setTitle(problem_title);
            const options = [];

            let j = 7;
            while (true) {
                const option = cells[i][j++];
                if (option == '') {
                    break;
                }
                let is_correct = false;
                if (option == answer) {
                    is_correct = true;
                }
                options.push(radio.createChoice(option, is_correct));
            }

            radio.setChoices(options)
            
        }

    }
    
}

