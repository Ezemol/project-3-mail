document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  function compose_email(reply_recipients, reply_subject, reply_body, reply, reply_timestamp, reply_sender) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emailView').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    const form = document.querySelector('#compose-form'); // variable de form

    // If es el primer email enviado
    if (reply !== true) {
      // Clear out composition fields 
      document.querySelector('#compose-recipients').value = '';
      document.querySelector('#compose-subject').value = '';
      document.querySelector('#compose-body').value = '';

      // Mandar email, toma datos de post.
      form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir que la página se recargue

        // Declarar variables del form
        const recipients = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;

        post_email(recipients, subject, body);
      });
    } else {
      // Declaro variables de los valores preestablecidos de reply
      const sender = reply_sender;
      const recipients = reply_recipients;
      const subject = reply_subject;
      const body = reply_body;
      const timestamp = reply_timestamp;

      // Prellenar el form
      document.querySelector('#compose-recipients').value = `${recipients}`;
      document.querySelector('#compose-body').placeholder = `${body}`;
      if (subject.startsWith("Re:")) {
        document.querySelector('#compose-subject').value = `${subject}`;
      } else {
        document.querySelector('#compose-subject').value = `Re: ${subject}`;
      }

      form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Agregar body nuevo al existente
        const form_body = document.querySelector('#compose-body').value;

        if (subject.startsWith("Re:")) {
          post_email(recipients, `${subject}`, `On ${timestamp}, ${sender} wrote: ${form_body}`);
        } else {
          post_email(recipients, `Re: ${subject}`, `On ${timestamp}, ${sender} wrote: ${form_body}`);
        }
      })
    };
  }

  function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emailView').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3 class="mailbox-title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

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
          `;

          // Clase de cada email
          newDiv.className = 'email-item';
          // Agregar background color a gris para los emails leídos
          if (email.read === true) {
            newDiv.classList.add('readed'); 
          }
            
          // Agregar div con email
          document.querySelector('#emails-view').appendChild(newDiv);

          // Correr función para seleccionar un email con id específico.
          document.querySelector(`#email-item-${email.id}`).addEventListener('click', () => get_email(email.id, mailbox));
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
        emailView.className = 'email-readed readed';        

        emailView.innerHTML = `
          <p><strong>From:</strong> ${email.sender}</p> 
          <p><strong>To:</strong> ${email.recipients.join(', ')}</p>   
          <p><strong>Subject:</strong> ${email.subject}</p> 
          <p><strong>Date:</strong> ${email.timestamp}</p>
          <hr>
          <p><strong>Body:</strong> ${email.body}</p> 
          <hr>
        `

        // If user no mando el mensaje puede archivarlo
        if (mailbox !== 'sent') {
          // Agregar boton de archivado
          emailView.innerHTML += `<button id="button-archived" class="btn-secondary btn">${email.archived ? "Unarchive" : "Archive"}</button>`;

          // Agregar boton de reply
          emailView.innerHTML += `<button id="button-reply" class="btn-secondary btn">Reply</button>`;


          // cambiar archived/unarchived
          document.querySelector('#button-archived').addEventListener('click', () => {
            put_email(email.id, !email.archived, true, true);
          }) 

          // Click button, compose-email
          document.querySelector('#button-reply').addEventListener('click', () => {
            if (email.user === email.sender) {
              compose_email(email.recipients, `${email.subject}`, `On ${email.timestamp}, ${email.recipients} wrote: ${email.body}`, true, email.timestamp, email.sender);
            } else {
              compose_email(email.sender, `${email.subject}`, `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`, true, email.timestamp, email.recipients);
            }        
          })
        }

        // Marcar como leído
        put_email(email.id, email.archived, true, false);

        // Mostrar en pantalla el email elegido
        document.querySelector('#emailView').style.display = 'block';

      })
      .catch(error => {
        // Manejo de errores
        console.error('Email not found', error);
      });
  }

  function post_email(recipients, subject, body) {
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
