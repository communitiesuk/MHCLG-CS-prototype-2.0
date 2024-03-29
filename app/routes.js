const slugify = require('slugify');
const express = require("express");
const router = express.Router();
const fs = require("fs");

// Add your routes here - above the module.exports line
const questionsPath = "./app/data/questions.json";
let questions;
const sectionsPath = "./app/data/sections.json";
let sections;
const categoriesPath = "./app/data/categories.json";
let categories;
const topicsPath = "./app/data/topics.json";
let topics;
const s6QuestionsPath = "./app/data/sprint6-questions.json";
let s6Questions;
let s6Classifiers = [];
s6Classifiers.questions = {};

const trim_regexp = /^\"?[\n\s]*(.+?)[\n\s]*\"?$/gm;
const subst = `$1`;

const standards_keys = ["gdpr", "pci","cyberessentials", "iso27001"]
const compliance_keys = ["psn", "nhsdspt"]
const level_keys = ["level1", "level2", "level3"]

const assessments = {
  "gdpr" : {
    short_name: "GDPR",
    access_key: "GDPR",
    slug: "GDPR",
    long_name: "General Data Protection Regulation (GDPR)",
    intro_text: "\n" +
      "Legal framework that determines how personal information from individuals is collected and processed."
  },
  "pci" : {
    short_name: "PCI",
    access_key: "PCI",
    slug: "PCI",
    long_name: "Payment Card Industry (PCI)",
    intro_text: "\n" +
      "Information security standard designed to increase controls around cardholder data to reduce credit card fraud."
  },
  "cyberessentials": {
    short_name: "CyberEssentials",
    access_key: "CE",
    slug: "CE",
    long_name: "Cyber Essentials",
    intro_text: "Government-backed scheme that helps organisations protect themselves against the threat of cyber attacks, providing basic controls organisations should have in place."
  },
  "psn": {
    short_name: "PSN",
    access_key: "PSN",
    slug: "PSN",
    long_name: "Public Sector Network",
    intro_text: "‘Walled garden’ approach that enables public sector organisations to work together and share resources in a secure, controlled environment."
  },
  "nhsdspt": {

    short_name: "NHS DSPT",
    access_key: "NHS DSPT",
    slug: "NHSDSPT",
    long_name: "NHS Data Security and Protection Toolkit",
    intro_text: "Self-assessment tool to provide assurance that organisations using NHS patient data are practising good data security."
  },
  "iso27001": {

    short_name: "ISO 27001",
    access_key: "ISO 27001",
    slug: "ISO27001",
    long_name: "ISO27001",
    intro_text: "International standard on how to manage information security, with requirements for establishing, implementing, maintaining and continually improving an information security management system (ISMS)."

  },

  "level1": {

    short_name: "Level 1",
    access_key: "level1",
    slug: "level1",
    long_name: "Level 1: Baseline",
    intro_text: "The minimum level that all local authorities should be meeting for basic cyber security.",
    standards: "Cyber Essentials, Cyber Essentials +"

  },

  "level2": {

    short_name: "Level 2",
    access_key: "level2",
    slug: "level2",
    long_name: "Level 2: Target",
    intro_text: "Additional controls that should be in place to mitigate against more technically capable cyber attacks.",
    standards: "PSN, PCI DSS, GDPR"
  },

  "level3": {

    short_name: "Level 3",
    access_key: "level3",
    slug: "level3",
    long_name: "Level 3: Advanced",
    intro_text: "For those facing the most advanced threats, or providing the most essential public services.",
    standards: "ISO 27001, NIS-CAF"
  },
  "all":{
    short_name: "All",
    long_name: "All controls",
    slug: "questions",
    access_key: "all",
    intro_text: "All of the questions across the Cyber Health Standard"
  }
}

const classifications = ["category", "topic", "section", "stage"];

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function copyQuestionObject(objectToCopy, keysToCopyRequired, keysToCopyOptional  ){
  let copyTo = {};
  keysToCopyRequired.forEach(function(key){
    copyTo[key.toLowerCase()] = objectToCopy[key].trim();
  });

  keysToCopyOptional.forEach(function(key) {
    if(objectToCopy[key].trim()!== ""){
      copyTo[key.toLowerCase()] = objectToCopy[key].trim();
    }
  });




  return copyTo;
}

fs.readFile(s6QuestionsPath, "utf8", (err, data) => {
  if (err) {
    throw err;
  }

  s6Questions = JSON.parse(data);
  //console.log(s6Questions.slice(0,3));

  let index = 0;
  s6Questions.forEach(function(question){

    index++;

    question.topic = question.topic.trim().replace(trim_regexp, subst);

    const questionObject = copyQuestionObject(question, ["id", "label","category", "topic", "section", "stage", "Type"], ["Sub question 1", "Sub question 2"] )

    // this is for creating an index of all of the questions
    s6Classifiers.questions[questionObject.id] = questionObject

    // this is for saving all of the standards into a collection
    Object.keys(assessments).forEach(function(key){

      let type = assessments[key];

      let access_key = type.access_key;
      if(! ( access_key === "all" || access_key.substr(0,5) === "level" )) {
        let slug = type.slug;

        if (!s6Classifiers[slug]){
          s6Classifiers[slug] = [];
        }

        if(question[access_key].length > 0) {
          let questionObjectInstance = clone(questionObject);
          questionObjectInstance.reference = question[access_key];
          s6Classifiers[slug].push(questionObjectInstance);
          questionObjectInstance = null
        }
      }
    })

    // this is for saving all of the classifications into a collection
    classifications.forEach(function(group){
      if (question[group]){
        if(!s6Classifiers[group]){
          s6Classifiers[group]={};
        }
        let group_slug = slugify(questionObject[group]).toLowerCase();
        if( !s6Classifiers[group][group_slug] ||
            !Array.isArray(s6Classifiers[group][group_slug])) {
          s6Classifiers[group][group_slug] = [];
        }
        let questionObjectInstance = clone(questionObject);
        s6Classifiers[group][group_slug].push(questionObjectInstance)
        questionObjectInstance = null
      }
    })

    s6Classifiers["level1"] = s6Classifiers["stage"]["level-1"];
    s6Classifiers["level2"] = s6Classifiers["stage"]["level-2"];
    s6Classifiers["level3"] = s6Classifiers["stage"]["level-3"];


  });


});



fs.readFile(questionsPath, "utf8", (err, data) => {
  if (err) {
    throw err;
  }
  questions = JSON.parse(data);
});

fs.readFile(sectionsPath, "utf8", (err, data) => {
  if (err) {
    throw err;
  }
  sections = JSON.parse(data);
  // Convert category CSVs into array
  sections.forEach((section) => {
    section.categories = section.categories.split(",");
  });
});

fs.readFile(topicsPath, "utf8", (err, data) => {
  if (err) {
    throw err;
  }
  topics = JSON.parse(data);
});

fs.readFile(sectionsPath, "utf8", (err, data) => {
  if (err) {
    throw err;
  }
  sections = JSON.parse(data);
  // Convert category CSVs into array
  sections.forEach((section) => {
    section.categories = section.categories.split(",");
  });
});
fs.readFile(categoriesPath, "utf8", (err, data) => {
  if (err) {
    throw err;
  }
  categories = JSON.parse(data);
  // Convert topic CSVs into array
  categories.forEach((category) => {
    category.topics = category.topics.split(",");
  });
});


router.get("/sprint-3/prototype-2/question/:questionID", (req, res) => {
  const question = questions.find(({ id }) => id === req.params.questionID);
  res.render("sprint-3/prototype-2/question", { question: question });
});

router.get("/sprint-3/prototype-2/topic/:topicSlug", (req, res) => {
  let topic = topics.find(({ slug }) => slug === req.params.topicSlug);
  // Convert question CSVs into an array of objects
  if (typeof topic.questions === "string") {
    let splitQuestions = topic.questions.split(",");
    let fullQuestions = [];
    splitQuestions.forEach((questionID) => {
      // Find question object by ID
      const fullQuestion = questions.find(({ id }) => id === questionID);
      fullQuestions.push(fullQuestion);
    });
    topic.questions = fullQuestions;
  }
  res.render("sprint-3/prototype-2/topic", { topic: topic });
});

router.get("/sprint-3/prototype-2/category/:categorySlug/", (req, res) => {
  const category = categories.find(
    ({ slug }) => slug === req.params.categorySlug
  );
  res.render("sprint-3/prototype-2/category", { category: category });
});

router.get("/sprint-3/prototype-2/category/:categorySlug/finished", (req, res) => {
  const category = categories.find(
    ({ slug }) => slug === req.params.categorySlug
  );
  res.render("sprint-3/prototype-2/category-finished", { category: category });
});

router.get("/sprint-3/prototype-1/question/:questionID", (req, res) => {
  const p1Questions = questions.filter(
    (question) => question.stage == "Stage 1"
  );
  const question = p1Questions.find(({ id }) => id === req.params.questionID);

  const currentIndex = p1Questions.indexOf(question);

  let nextQuestionHref;
  if (p1Questions.length - 1 != currentIndex) {
    nextQuestionHref =
      "/sprint-3/prototype-1/question/" + p1Questions[currentIndex + 1].id;
  } else {
    nextQuestionHref = "/sprint-3/prototype-1/confirmation";
  }

  let prevQuestionHref;
  if (currentIndex != 0) {
    prevQuestionHref =
      "/sprint-3/prototype-1/question/" + p1Questions[currentIndex - 1].id;
  } else {
    prevQuestionHref = "/sprint-3/prototype-1/start-assessment";
  }

  res.render("sprint-3/prototype-1/question", {
    question,
    prevQuestionHref,
    nextQuestionHref,
  });
});

router.get("/sprint-3/prototype-2/category/:categorySlug", (req, res) => {
  const category = categories.find(
    ({ slug }) => slug === req.params.categorySlug
  );
  res.render("sprint-3/prototype-2/category", { category: category });
});

router.get("/sprint-3/prototype-1/category/:categorySlug", (req, res) => {
  const category = categories.find(
    ({ slug }) => slug === req.params.categorySlug
  );
  const firstQuestionId = "1.1.1";
  res.render("sprint-3/prototype-1/category", { category, firstQuestionId });
});

router.get("/sprint-3/prototype-2/start-assessment/", (req, res) => {
  res.render("sprint-3/prototype-2/start-assessment", { sections: sections });
});

router.get("/sprint-3/prototype-2/result/", (req, res) => {
  res.render("sprint-3/prototype-2/result", { sections: sections });
});

router.get("/sprint-3/prototype-2/assessment-index/", (req, res) => {
  res.render("sprint-3/prototype-2/assessment-index", { sections: sections });
});

router.get("/sprint-3/prototype-1/start-assessment/", (req, res) => {
  res.render("sprint-3/prototype-1/start-assessment", { sections: sections });
});

router.get("/sprint-5/prototype-1/start-assessment/", (req, res) => {
  res.render("sprint-5/prototype-1/start-assessment", { sections: sections });
});

router.get("/sprint-5/prototype-1/category/:categorySlug", (req, res) => {
  const category = categories.find(
    ({ slug }) => slug === req.params.categorySlug
  );
  res.render("sprint-5/prototype-1/category", { category: category });
});

  router.get("/sprint-5/prototype-1/risk", (req, res) => {
  const questions = req.session.data['questions'];
  let score = 0;
  for (const key in questions) {
    const question = questions[key];
    if(question.answer == 'yes') {
      const level = question.level;
      if (level == 'medium') {
        score++;
      }
      else if (level == 'high') {
        score = score + 2;
      }
    }
  }
  let riskLevel = 'high';
  if(score >= 7) {
    riskLevel = 'medium';
  }
  if(score >= 11) {
    riskLevel = 'low';
  }
  let riskSlug = riskLevel.replace(/ /g, '-');
  res.render("sprint-5/prototype-1/risk", { riskLevel: riskLevel, riskSlug: riskSlug, score: score, wrongQuestions: wrongQuestionsOnly(questions) });
});

// Prototype 6

router.get("/:sprint/prototype/all-questions-overview/", (req, res) => {
  updateCountOnAssessment("all", req);
  let pathway = assessments["all"]
  res.render(req.params.sprint+"/prototype/all-questions-overview", { sections: sections, assessments, pathway });
});

router.get("/:sprint/prototype/:pathWay/question/:questionID", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.pathWay;
  const assessment_pathway = assessments[pathway];
  let snippet_content;
  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: assessment_pathway.short_name,
      href: "/"+req.params.sprint+"/prototype/" + pathway
    }

  ];
  try {
    snippet_content = fs.readFileSync(__dirname + '/snippets/' + req.params.questionID + '.html', 'utf8')
  } catch (e){
    snippet_content = fs.readFileSync(__dirname + '/snippets/default.html', 'utf8')
  }
  // if we are passed a url variable for an expert review then redirect somewhere?

  res.render(req.params.sprint+"/prototype/question", {
    question,
    pathway,
    snippet_content,
    assessment_pathway,
    breadcrumb_items
  });

});


router.get("/:sprint/prototype/:pathWay/question/:questionID/workingtowards", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.pathWay;
  const assessment_pathway = assessments[pathway];

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: assessment_pathway.short_name,
      href: "/"+req.params.sprint+"/prototype/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/" + pathway + "/question/"+question.id
    }

  ];


  // if we are passed a url variable for an expert review then redirect somewhere?

  res.render(req.params.sprint+"/prototype/workingtowards", {
    question,
    pathway,
    breadcrumb_items
  });
});



router.get("/:sprint/prototype/:pathWay/question/:questionID/askanexpert", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.pathWay;
  const assessment_pathway = assessments[pathway];

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: assessment_pathway.short_name,
      href: "/"+req.params.sprint+"/prototype/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/" + pathway + "/question/"+question.id
    }

  ];

  const link = '/'+req.params.sprint+'/prototype/' + pathway + '/question/' + question.id
  // if we are passed a url variable for an expert review then redirect somewhere?

  res.render(req.params.sprint+"/prototype/askanexpert", {
    question,
    pathway,
    link,
    breadcrumb_items
  });
});



router.post("/:sprint/prototype/:pathWay/question/:questionID/workingtowards", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];

    let completed = false
    if (req.body.answer === "workingtowards") {
      completed = true
    }

    req.session.question_data[req.params.questionID] = {
      "answer": "workingtowards",
      "complete": completed,
      "workingtowards_date": req.body["workingtowards-day"] + '/' + req.body["workingtowards-month"] + '/' + req.body["workingtowards-year"]
    }

    res.redirect("../..");

});

router.get("/:sprint/prototype/:pathWay/question/:questionID/metwithexceptions", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.pathWay;
  const assessment_pathway = assessments[pathway];

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: assessment_pathway.short_name,
      href: "/"+req.params.sprint+"/prototype/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/" + pathway + "/question/"+question.id
    }

  ];

  res.render(req.params.sprint+"/prototype/metwithexceptions", {
    question,
    pathway,
    breadcrumb_items
  });
});

router.get("/:sprint/prototype/:pathWay/question/:questionID/notmet", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.pathWay;
  const assessment_pathway = assessments[pathway];

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: assessment_pathway.short_name,
      href: "/"+req.params.sprint+"/prototype/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/" + pathway + "/question/"+question.id
    }

  ];

  res.render(req.params.sprint+"/prototype/notmet", {
    question,
    pathway,
    breadcrumb_items
  });
});

router.post("/:sprint/prototype/:pathWay/question/:questionID/notmet", (req, res) => {


  res.redirect("../..");

});

router.post("/:sprint/prototype/:pathWay/question/:questionID/metwithexceptions", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];


    req.session.question_data[req.params.questionID] = {
      "answer": "metwithexceptions",
      "complete": true,
      "metwithexceptions": req.body["metwithexceptions"]
    }

    res.redirect("../..");

});


router.post("/:sprint/prototype/:pathWay/question/:questionID/riskaccepted", (req, res) => {

    req.session.question_data[req.params.questionID] = {
      "answer": "riskaccepted",
      "complete": true,
      "riskaccepted": req.body["riskaccepted"]
    }

    res.redirect("../..");

});

router.get("/:sprint/prototype/:pathWay/question/:questionID/riskaccepted", (req, res) => {
  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.pathWay;
  const assessment_pathway = assessments[pathway];

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: assessment_pathway.short_name,
      href: "/"+req.params.sprint+"/prototype/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/" + pathway + "/question/"+question.id
    }

  ];

  // if we are passed a url variable for an expert review then redirect somewhere?
  res.render(req.params.sprint+"/prototype/riskaccepted", {
    question,
    pathway,
    breadcrumb_items
  });

});


router.post("/:sprint/prototype/:pathWay/question/:questionID/metwithexceptions", (req, res) => {

  // NTH:  if it is blank we should display some validation?

  // NTH: if a skip parameter has been set, we should route to the next question

  // save valid results in the session

  const question = s6Classifiers.questions[req.params.questionID];

  if (!question.type || question.type === "standard_radio") {

    req.session.question_data[req.params.questionID] = {
      "answer": "metwithexceptions",
      "complete": true,
      "exceptions": req.body.exceptionsentered
    }

    res.redirect("../..");

  }
});


router.post("/:sprint/prototype/:pathWay/question/:questionID/riskaccepted", (req, res) => {

  // NTH:  if it is blank we should display some validation?

  // NTH: if a skip parameter has been set, we should route to the next question

  // save valid results in the session

  const question = s6Classifiers.questions[req.params.questionID];

  if (!question.type || question.type === "standard_radio") {

    req.session.question_data[req.params.questionID] = {
      "answer": "riskaccepted",
      "complete": true,
      "riskaccepted": req.body.riskacceptedentered
    }

    res.redirect("../..");

  }
});

router.post("/:sprint/prototype/:pathWay/question/:questionID", (req, res) => {

  // NTH:  if it is blank we should display some validation?

  // NTH: if a skip parameter has been set, we should route to the next question

  // save valid results in the session

  const pathway_key = req.params.pathWay;
  const pathwayObject = assessments[pathway_key];
  const question = s6Classifiers.questions[req.params.questionID];


    let completed = false
    let special_case = false
    if( req.body.answer === "met" ) {
      completed = true
    } else if( req.body.answer === "riskaccepted" || req.body.answer === "metwithexceptions" ||req.body.answer === "workingtowards"  ||req.body.answer === "notmet"   ) {
      special_case = true
    }

    if(!req.session.question_data){
      req.session.question_data = {};
    }

    req.session.question_data[req.params.questionID] = {
      "answer" : req.body.answer,
      "complete" : completed
    }
    // if the options were special we need redirect to the appropriate special route (e.g. riskaccepted, metwithexceptions, workingtowards )
    if( special_case ) {
      res.redirect(req.params.questionID+"/"+req.body.answer)
    } else {
      let redirect_to;
      s6Classifiers[pathwayObject.slug].some(function(question){
        if(req.session.question_data && req.session.question_data[question.id] &&  req.session.question_data[question.id].complete){
          if(! req.session.question_data[question.id].complete)
          {
            redirect_to = question.id;
            return true
          }
        } else {
          redirect_to = question.id;
          return true
        }
        return false;
      })

      if( redirect_to ){
        res.redirect(redirect_to);
      } else {
        res.redirect("..");
      }

    }    // for met or for not met, go to the index...

});


let retrieve_category = function(category_slug){
  let final_category;
  categories.forEach(function(category){
    if (category.slug.toLowerCase().trim() === category_slug) {
      final_category = category
    }
  });
  return final_category;
}

// Category based questions

router.get("/:sprint/prototype/category/:categorySlug/question/:questionID", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.categorySlug;
  const assessment_pathway = retrieve_category(pathway);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    },
    {
      text: assessment_pathway.name,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway
    }

  ];


  let snippet_content;
  try {
    snippet_content = fs.readFileSync(__dirname + '/snippets/' + req.params.questionID + '.html', 'utf8')
  } catch (e){
    snippet_content = fs.readFileSync(__dirname + '/snippets/default.html', 'utf8')
  }

  // if we are passed a url variable for an expert review then redirect somewhere?

  res.render(req.params.sprint+ "/prototype/question", {
    question,
    pathway,
    snippet_content,
    breadcrumb_items
  });

});



router.get("/:sprint/prototype/category/:categorySlug/question/:questionID/workingtowards", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.categorySlug;
  const assessment_pathway = retrieve_category(pathway);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    },
    {
      text: assessment_pathway.name,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway + "/question/"+question.id
    }

  ];




  // if we are passed a url variable for an expert review then redirect somewhere?

  res.render("sprint-6/prototype/workingtowards", {
    question,
    pathway,
    breadcrumb_items
  });
});


router.get("/:sprint/prototype/category/:categorySlug/question/:questionID/askanexpert", (req, res) => {


  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.categorySlug;
  const assessment_pathway = retrieve_category(pathway);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    },
    {
      text: assessment_pathway.name,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway + "/question/"+question.id
    }

  ];


  const link = "/"+req.params.sprint+"/prototype/category/"+ pathway + "/question/"+question.id;

  // if we are passed a url variable for an expert review then redirect somewhere?

  res.render(req.params.sprint+"/prototype/askanexpert", {
    question,
    pathway,
    link,
    breadcrumb_items
  });
});


router.get("/:sprint/prototype/category/:categorySlug/question/:questionID/notmet", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.categorySlug;
  const assessment_pathway = retrieve_category(pathway);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    },
    {
      text: assessment_pathway.name,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway + "/question/"+question.id
    }

  ];

  res.render(req.params.sprint+"/prototype/notmet", {
    question,
    pathway,
    breadcrumb_items
  });
});

router.post("/:sprint/prototype/category/:categorySlug/question/:questionID/notmet", (req, res) => {

  res.redirect("../..");

});

router.post("/:sprint/prototype/category/:categorySlug/question/:questionID/workingtowards", (req, res) => {

  req.session.question_data[req.params.questionID] = {
    "answer": "workingtowards",
    "complete": true,
    "workingtowards_date": req.body["workingtowards-day"] + '/' + req.body["workingtowards-month"] + '/' + req.body["workingtowards-year"]
  }

  res.redirect("../..");

});

router.get("/:sprint/prototype/category/:categorySlug/question/:questionID/metwithexceptions", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.categorySlug;
  const assessment_pathway = retrieve_category(pathway);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    },
    {
      text: assessment_pathway.name,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway + "/question/"+question.id
    }

  ];


  res.render(req.params.sprint+"/prototype/metwithexceptions", {
    question,
    pathway,
    breadcrumb_items
  });
});


router.post("/:sprint/prototype/category/:categorySlug/question/:questionID/metwithexceptions", (req, res) => {



  req.session.question_data[req.params.questionID] = {
    "answer": "metwithexceptions",
    "complete": true,
    "metwithexceptions": req.body["metwithexceptions"]
  }

  res.redirect("../..");

});


router.post("/:sprint/prototype/category/:categorySlug/question/:questionID/riskaccepted", (req, res) => {



  req.session.question_data[req.params.questionID] = {
    "answer": "riskaccepted",
    "complete": true,
    "riskaccepted": req.body["riskaccepted"]
  }

  res.redirect("../..");

});

router.get("/:sprint/prototype/category/:categorySlug/question/:questionID/riskaccepted", (req, res) => {

  const question = s6Classifiers.questions[req.params.questionID];
  const pathway  = req.params.categorySlug;
  const assessment_pathway = retrieve_category(pathway);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    },
    {
      text: assessment_pathway.name,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway
    },
    {
      text: question.id,
      href: "/"+req.params.sprint+"/prototype/category/" + pathway + "/question/"+question.id
    }

  ];

  // if we are passed a url variable for an expert review then redirect somewhere?
  res.render(req.params.sprint+"/prototype/riskaccepted", {
    question,
    pathway,
    breadcrumb_items
  });

});


router.post("/:sprint/prototype/category/:categorySlug/question/:questionID/metwithexceptions", (req, res) => {

  // NTH:  if it is blank we should display some validation?

  // NTH: if a skip parameter has been set, we should route to the next question

  // save valid results in the session

  const question = s6Classifiers.questions[req.params.questionID];

  if (!question.type || question.type === "standard_radio") {

    req.session.question_data[req.params.questionID] = {
      "answer": "metwithexceptions",
      "complete": true,
      "exceptions": req.body.exceptionsentered
    }

    res.redirect("../..");

  }
});


router.post("/:sprint/prototype/category/:categorySlug/question/:questionID/riskaccepted", (req, res) => {

  // NTH:  if it is blank we should display some validation?

  // NTH: if a skip parameter has been set, we should route to the next question

  // save valid results in the session

  const question = s6Classifiers.questions[req.params.questionID];

  if (!question.type || question.type === "standard_radio") {

    let completed = false

    req.session.question_data[req.params.questionID] = {
      "answer": "riskaccepted",
      "complete": true,
      "riskaccepted": req.body.riskacceptedentered
    }

    res.redirect("../..");

  }
});

router.post("/:sprint/prototype/category/:categorySlug/question/:questionID", (req, res) => {


  const question = s6Classifiers.questions[req.params.questionID];


    let completed = false
    let special_case = false
    if( req.body.answer === "met" ) {
      completed = true
    } else if( req.body.answer === "riskaccepted" || req.body.answer === "metwithexceptions" ||req.body.answer === "workingtowards"||req.body.answer === "notmet"   ) {
      special_case = true
    }

    if(!req.session.question_data){
      req.session.question_data = {};
    }
    req.session.question_data[req.params.questionID] = {
      "answer" : req.body.answer,
      "complete" : completed
    }
    // if the options were special we need redirect to the appropriate special route (e.g. riskaccepted, metwithexceptions, workingtowards )
    if( special_case ) { res.redirect(req.params.questionID+"/"+req.body.answer) }
    else{
      res.redirect("..");
    }    // for met or for not met, go to the index...


});



let updateCountOnAssessment = function(assessment_index, req) {
  const slug = assessments[assessment_index].slug;
  const questions = s6Classifiers[slug];

  if (!req.session){
    req.session = {};
  }

  if (!req.session.question_data){
    req.session.question_data = {};
  }

  let questions_count = 0;
  let questions_complete = 0;

  Object.keys(questions).forEach(function(question_index){
    let question = questions[question_index];
    questions_count++;
    if ( req.session.question_data[question.id] && req.session.question_data[question.id].complete){
      questions_complete++;
    }
  });

  assessments[assessment_index].number_completed = questions_complete;
  assessments[assessment_index].number_of_questions = questions_count;
  assessments[assessment_index].percentage_complete = Math.floor(100*(questions_complete/questions_count));

  assessments[assessment_index].is_complete = (assessments[assessment_index].number_completed === assessments[assessment_index].number_of_questions);

}

router.get("/:sprint/prototype/council-overview", (req, res) => {
  let assessment_keys = Object.keys(assessments)
  assessment_keys.forEach(function(key){
    updateCountOnAssessment(key, req);
  });

  compliance_keys.forEach(function(key){
    updateCountOnAssessment(key, req);
  });

  level_keys.forEach(function(key){
    updateCountOnAssessment(key, req);
    if(key==="level1"){
      assessments[key].descendents_complete = true;
    } else if(key==="level2"){
      assessments[key].descendents_complete = assessments["level1"].is_complete;
    } else if(key==="level3"){
      assessments[key].descendents_complete = assessments["level1"].is_complete && assessments["level2"].is_complete;
    }

  });

  res.render(req.params.sprint+"/prototype/council-overview", {
    assessments,
    standards_keys,
    compliance_keys,
    level_keys
  })
})

const table_header = [
  {
    text: "Risk"
  },
  {
    text: "Topic"
  },
  {
    text: "Control"
  },
  {
    text: "Status"
  },
  {
    text: "Action"
  }
];

router.get("/:sprint/prototype/:pathWay", (req, res) => {
  const pathway_key  = req.params.pathWay;
  const pathway = assessments[pathway_key];


  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+ req.params.sprint + "/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+ req.params.sprint + "/prototype/all-questions-overview"
    }

  ];

  let pathway_questions = s6Classifiers[pathway.slug]

  updateCountOnAssessment(pathway_key, req);


  let table_rows = pathway_questions.map(function(this_row) {

    let tag = "";
    let risk_tag = "";
    // calculate a rand value from 0 - 100 based on a seed?

    // calculate the html of the status

    if (!req.session){
      req.session = {};
    }

    if (!req.session.question_data){
      req.session.question_data = {};
    }

    if (req.session.question_data[this_row.id])
    {
      let answer = req.session.question_data[this_row.id].answer


      if (answer === "met") {
        tag = "<strong class='govuk-tag govuk-tag--green'>Met</strong>"
      } else if (answer === "notmet") {
        tag = "<strong class='govuk-tag govuk-tag--red'>Not Met</strong>"
      } else if ( answer === "riskaccepted" ) {
        tag = "<strong class='govuk-tag govuk-tag--pink'>Risk Accepted</strong>"
      } else if ( answer === "workingtowards" ) {
        tag = "<strong class='govuk-tag govuk-tag--yellow'>Working Towards</strong>"
      } else if ( answer === "metwithexceptions" ) {
        tag = "<strong class='govuk-tag govuk-tag--green'>Met with exceptions</strong>"
      }
    } else {
      tag = "<strong class='govuk-tag govuk-tag--blue'>Not Answered</strong>"
    }

    if (this_row.id.split(".")[0] < 3 ){
      risk_tag = "<strong class='govuk-tag govuk-tag--red'>High</strong>"
    } else if(this_row.id.split(".")[0] < 5 ){
      risk_tag = "<strong class='govuk-tag govuk-tag--orange'>Medium</strong>"
    } else {
      risk_tag = "<strong class='govuk-tag govuk-tag--green'>Low</strong>"
    }

    // generate the question url

    let question_url = "/"+req.params.sprint+"/prototype/"+pathway_key+"/question/"+this_row.id;
    let view_link = "<a href='"+question_url+"'>View <span class='govuk-visually-hidden'>control - "+ this_row.label+"</span></a>";

    return  [
      {
        html: risk_tag
      },
      {
        text: this_row.topic
      },
      {
        text: this_row.label
      },
      {
        html: tag
      },
      {
        html: view_link
      }
    ];
  });

  let mark_as_met = "/"+req.params.sprint+"/prototype/"+pathway_key+"/mark-as-met";
  res.render(req.params.sprint+"/prototype/pathway-overview", {
    pathway,
    table_header,
    table_rows,
    pathway_questions,
    mark_as_met,

  });
});


router.get("/:sprint/prototype/category/:categorySlug/mark-as-met", (req, res) => {
  const category_slug  = req.params.categorySlug;
  let category_questions = s6Classifiers["category"][category_slug];
  if (!req.session.question_data){
    req.session.question_data = {};
  }

  category_questions.forEach(function(question){
    if (!req.session.question_data[question.id]){
      req.session.question_data[question.id] = {};
    }
    req.session.question_data[question.id].answer = 'met';
    req.session.question_data[question.id].complete = true;

  });

  req.session.save(function() {
    res.redirect('/'+req.params.sprint+'/prototype/category/' + category_slug);
  });

});

router.get("/:sprint/prototype/:pathWay/mark-as-met", (req, res) => {
  const pathway_key  = req.params.pathWay;
  const pathway = assessments[pathway_key];
  let pathway_questions = s6Classifiers[pathway.slug]
  if (!req.session.question_data){
    req.session.question_data = {};
  }

  pathway_questions.forEach(function(question){
    if (!req.session.question_data[question.id]){
      req.session.question_data[question.id] = {};
    }
    req.session.question_data[question.id].answer = 'met';
    req.session.question_data[question.id].complete = true;

  });

  req.session.save(function() {
    res.redirect('/'+req.params.sprint+'/prototype/'+ pathway_key);
  });

});

router.get("/:sprint/prototype/category/:categorySlug/", (req, res) => {

  const category_slug  = req.params.categorySlug;
  const thisCategory = retrieve_category(category_slug);

  let breadcrumb_items = [
    {
      text: "Council Cyber Health Overview",
      href: "/"+req.params.sprint+"/prototype/council-overview"
    },
    {
      text: "Explore all controls",
      href: "/"+req.params.sprint+"/prototype/all-questions-overview"
    }

  ];


  let category_questions = s6Classifiers["category"][category_slug];
  let questions_count = 0;
  let questions_complete = 0;

  if (!req.session){
    req.session = {};
  }
  if (!req.session.question_data){
    req.session.question_data = {};
  }


  Object.keys(category_questions).forEach(function(question_index){
    let question = category_questions[question_index];
    questions_count++;
    if ( req.session.question_data && req.session.question_data[question.id] && req.session.question_data[question.id].complete){
      questions_complete++;
    }
  });

  let percentage_complete = Math.floor(100*(questions_complete/questions_count));

  let pathway = {
    short_name : thisCategory.name,
    long_name : thisCategory.name,
    number_completed: questions_complete,
    number_of_questions: questions_count,
    percentage_complete: percentage_complete
  };

  let table_rows = category_questions.map(function(this_row) {

    let tag = ""
    let risk_tag = ""
    // calculate a rand value from 0 - 100 based on a seed?

    // calculate the html of the status

    if (!req.session){
      req.session = {};
    }

    if (!req.session.question_data){
      req.session.question_data = {};
    }

    if (req.session.question_data[this_row.id])
    {
      let answer = req.session.question_data[this_row.id].answer

      if (answer === "met") {
        tag = "<strong class='govuk-tag govuk-tag--green'>Met</strong>"
      } else if (answer === "notmet") {
        tag = "<strong class='govuk-tag govuk-tag--red'>Not Met</strong>"
      } else if ( answer === "riskaccepted" ) {
        tag = "<strong class='govuk-tag govuk-tag--pink'>Risk Accepted</strong>"
      } else if ( answer === "workingtowards" ) {
        tag = "<strong class='govuk-tag govuk-tag--yellow'>Working Towards</strong>"
      } else if ( answer === "metwithexceptions" ) {
        tag = "<strong class='govuk-tag govuk-tag--green'>Met with exceptions</strong>"
      }
    } else {
      tag = "<strong class='govuk-tag govuk-tag--blue'>Not Answered</strong>"
    }


    if (this_row.id.split(".")[0] < 3 ){
      risk_tag = "<strong class='govuk-tag govuk-tag--red'>High</strong>"
    } else if(this_row.id.split(".")[0] < 5 ){
      risk_tag = "<strong class='govuk-tag govuk-tag--orange'>Medium</strong>"
    } else {
      risk_tag = "<strong class='govuk-tag govuk-tag--green'>Low</strong>"
    }

    // generate the question url

    let question_url = "/"+req.params.sprint+"/prototype/category/"+category_slug+"/question/"+this_row.id;
    let view_link = "<a href='"+question_url+"'>View <span class='govuk-visually-hidden'>control - "+ this_row.label+"</span></a>";

    return  [
      {
        html: risk_tag
      },
      {
        text: this_row.topic
      },
      {
        text: this_row.label
      },
      {
        html: tag
      },
      {
        html: view_link
      }
    ];
  });

  let mark_as_met = "/"+req.params.sprint+"/prototype/category/"+category_slug+"/mark-as-met";
  res.render(req.params.sprint+"/prototype/pathway-overview", {
    pathway,
    table_header,
    table_rows,
    category_questions,
    mark_as_met,
    breadcrumb_items
  });
});

// Returns an array of questions with the answer "no" or blank, sorted by level
function wrongQuestionsOnly(questions) {
  let wrongQuestions = [];
  for (const key in questions) {
    const question = questions[key];
    if(question.answer == 'no' || typeof question.answer === 'undefined') {
      wrongQuestions.push(question)
    }
  }
  wrongQuestions.sort(function(a, b) {
    var levelA = a.level.toUpperCase();
    var levelB = b.level.toUpperCase();
    if (levelA < levelB) {
      return -1;
    }
    if (levelA > levelB) {
      return 1;
    }

    // equal
    return 0;
  });
  return wrongQuestions;
}

module.exports = router;
