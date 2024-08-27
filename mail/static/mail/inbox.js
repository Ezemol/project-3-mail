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
    document.querySelector('#emailView').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields 
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    const form = document.querySelector('#compose-form'); // variable de form

    // Mandar email, toma datos de post.
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevenir que la página se recargue

      // Declarar variables del form
      const recipients = document.querySelector('#compose-recipients').value;
      const subject = document.querySelector('#compose-subject').value;
      const body = document.querySelector('#compose-body').value;

      send_email(recipients, subject, body);
    });
  }

  function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emailView').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Correr función para mostrar emails de esta página
    get_emails(mailbox);
  }

  function get_emails(mailbox) {
    fetch(`/emails/${mailbox}`) 
      .then(response => response.json())
      .then(emails => {
        // print emails
        console.log(emails);

        // Ordenar los emails de más reciente a más antiguo
        emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Agregar cada email a la página
        emails.forEach(email => {
          // Crear div para cada email
          const newDiv = document.createElement('div');

          newDiv.id = `email-item-${email.id}`;

          // Agregar cada email nuevo
          newDiv.innerHTML = `
          <p><strong>From:</strong> ${email.sender}</p>   
          <p><strong>Subject:</strong> ${email.subject}</p> 
          <p><strong>Date:</strong> ${email.timestamp}</p>
          <p><button id='email-button-${email.id}'>Go to Email</button></p>
          <hr>
          `;

          // Agregar background color a gris para los emails leídos
          if (email.read === true) {
            newDiv.className = ('readed'); 
          } else {
            newDiv.className = 'email-item';
          }

          // Agregar div con email
          document.querySelector('#emails-view').appendChild(newDiv);

          // Correr función para seleccionar un email con id específico.
          document.querySelector(`#email-button-${email.id}`).addEventListener('click', () => get_email(email.id, mailbox));
        });
      })
      .catch(error => {
        // Manejo de errores
        console.error('Invalid mailbox.', error);
      }); 
  }

  function get_email(email_id, mailbox) {
    fetch(`/emails/${email_id}`)
      .then(response => response.json())
      .then(email => {
        // Imprimir en consola
        console.log(email);

        // Ocultar otras vistas
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        
        // Declarar variable de email
        const emailView = document.querySelector('#emailView');
        
        // Agregar a la clase de mensajes leídos
        emailView.className = 'readed'; 

        emailView.innerHTML = `
          <p><strong>From:</strong> ${email.sender}</p> 
          <p><strong>To:</strong> ${email.recipients.join(', ')}</p>   
          <p><strong>Subject:</strong> ${email.subject}</p> 
          <p><strong>Date:</strong> ${email.timestamp}</p>
          <hr>
          <p><strong>Body:</strong> ${email.body}</p> 
          <hr>
        `

        if (mailbox !== 'sent') {
          // Agregar boton
          emailView.innerHTML += `<button id="button-archived">${email.archived ? "Unarchive" : "Archive"}</button>`;
          // cambiar archived/unarchived
          document.querySelector('#button-archived').addEventListener('click', () => {
            put_email(email.id, !email.archived, true, true);
          });
        }        

        // Si no hay cambios no pasa nada.
        put_email(email.id, email.archived, true, false);
    
        // Mostrar en pantalla el email elegido
        document.querySelector('#emailView').style.display = 'block';

      })
      .catch(error => {
        // Manejo de errores
        console.error('Email not found', error);
      });
  }

  function send_email(recipients, subject, body) {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients, // receiber of post
        subject: subject, // Subject of post
        body: body // Body of post
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);

      // Mandar al usuario a la página de sent email
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('At least one recipient required.', error);
    });
  }

  function put_email(email_id, archived, read, change) {
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: archived,
        read: read
      })
    })
    .then(() => {
      // Si el estado de 'archived' ha cambiado, recarga la bandeja de entrada
      if (change === true) {
        load_mailbox('inbox');  // Si se ha archivado, vuelve a la bandeja de entrada
      } else {
        console.log('Email updated successfully.');
      }
    })
    .catch(error => {
      console.error("Error updating email", error);
    });
  }
}); // Fin de todo
