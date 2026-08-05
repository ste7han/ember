/**
 * De commando's van de bot, op één plek.
 *
 * Deze lijst wordt door drie dingen gebruikt:
 *
 *   functions/api/telegram.js    om /help mee op te bouwen
 *   scripts/telegram-commands.mjs  om het menu in Telegram bij te werken
 *   scripts/telegram-webhook.mjs   idem, bij het eenmalig aanzetten
 *
 * Voeg je hier een regel toe, dan staat hij na de volgende deploy vanzelf in
 * het menu naast het tekstvak. Er is dus geen tweede plek die je kunt vergeten.
 *
 * De namen moeten overeenkomen met een `commands`-ingang in TOPICS; een
 * commando dat hier staat maar daar niet, doet niets.
 */
export const MENU = [
  { command: 'project', description: 'How this works' },
  { command: 'progress', description: 'How many cards we have' },
  { command: 'vault', description: 'Photos of the cards we own' },
  { command: 'checklist', description: 'What counts as a card, and why' },
  { command: 'furnace', description: 'Burning tokens for a card' },
  { command: 'giveaway', description: 'What is running, and how winners are drawn' },
  { command: 'fees', description: 'Where the money goes' },
  { command: 'ca', description: 'The contract address' },
]
