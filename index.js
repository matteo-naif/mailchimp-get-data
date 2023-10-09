require('dotenv').config(); // Carica le variabili d'ambiente da .env

const fs = require('fs');
const util = require('util');
const writeFileAsync = util.promisify(fs.writeFile);

const mailchimp = require('@mailchimp/mailchimp_marketing');

const apiKey = process.env.API_KEY;
const serverRegion = process.env.SERVER_REGION || '';
const audienceId = process.env.ID_AUDIENCE || '';

console.log({ apiKey, serverRegion, audienceId});

async function getInterestCategories() {
  mailchimp.setConfig({
    apiKey,
    server: serverRegion,
  });

  try {
    const response = await mailchimp.lists.getListInterestCategories(audienceId);
    return response.categories.map(group => ({ id: group.id, name: group.title }));
  } catch (error) {
    console.error('Errore nel recupero delle categorie di interesse:', error);
    return [];
  }
}

async function getInterestsForCategory(categoryId) {
  try {
    const response = await mailchimp.lists.listInterestCategoryInterests(audienceId, categoryId);
    return response?.interests.map(interest => ({ id: interest.id, name: interest.name }));
  } catch (error) {
    console.error('Errore nel recupero degli interessi per la categoria:', error);
    return [];
  }
}

async function main() {
  const interestCategories = await getInterestCategories();
  const outputFile = 'output.txt'; // Nome del file di output

  let outputData = '';

  for (const interestsGroup of interestCategories) {
    const interestsList = await getInterestsForCategory(interestsGroup.id);

    outputData += `\n\n${interestsGroup.name}\n`;
    outputData += interestsList.map(el => `- ${el.name} (id: ${el.id})`).join('\n');
  }

  try {
    await writeFileAsync(outputFile, outputData, 'utf8');
    console.log(`I dati sono stati scritti nel file: ${outputFile}`);
  } catch (error) {
    console.error('Errore nella scrittura del file:', error);
  }
}

main();