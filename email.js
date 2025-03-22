const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendDailyTaskEmail = async (taskList) => {
  const message = {
    to: 'user@example.com', // Recipient's email
    from: 'your_email@example.com', // Verified sender
    subject: 'Daily Task Reminder',
    text: `Here are your tasks for today:\n\n${taskList}`,
  };

  try {
    await sgMail.send(message);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

// Example task list
const tasks = [
  { title: 'Task 1', priority: 'high', dueDate: '2025-03-17' },
  { title: 'Task 2', priority: 'medium', dueDate: '2025-03-18' },
];
const taskList = tasks.map(task => `${task.title} - Priority: ${task.priority} - Due: ${task.dueDate}`).join('\n');

// Send the daily email
sendDailyTaskEmail(taskList);
