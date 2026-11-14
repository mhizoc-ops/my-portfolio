export function makeDraft(lead) {
  const firstName = lead.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${firstName},\n\nThanks for reaching out about ${lead.service.toLowerCase()}. I’d be happy to learn a little more about what you’re looking for and help you find the right next step.\n\nWould you be available for a quick conversation this week? Feel free to reply with a time that works for you.\n\nBest,\nThe LeadFlow team`;
}
