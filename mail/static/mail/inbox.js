document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
  




function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Correr función para mostrar emails de esta página
  get_emails(mailbox);
}


// conseguir emails en una página
// Mandar GET y recibir emails en X mailbox
function get_emails(mailbox) {
  fetch(`/emails/${mailbox}`) 
  .then(response => response.json())
  .then(emails => {
    // print emails
    console.log(emails);
    
    // Agregar cada email a la página
    emails.forEach(email => {
      // Crear div para cada email
      const newDiv = document.createElement('div');
      newDiv.className = 'email-item';

      // Agregar cada email nuevo
      newDiv.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p> 
      <p><strong>To:</strong> ${email.recipients.join(', ')}</p>   
      <p><strong>Subject:</strong> ${email.subject}</p> 
      <p><strong>Body:</strong> ${email.body}</p> 
      <p><strong>Date:</strong> ${email.timestamp}</p> 
      `; // .join(", ") sirve por si hay varios destinatarios, que aparezcan separados por una coma

      document.querySelector('#emails-view').appendChild(newDiv);
    });
  })
  .catch(error => {
    // Manejo de errores
    console.error('Invalid mailbox.', error);
  }); 
}
});