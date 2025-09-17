import React from 'react';
import { Building2 } from 'lucide-react';

const Loading = ({ message = 'Cargando...', size = 'medium' }) => {
 const sizeClasses = {
   small: {
     container: '1rem',
     spinner: '1.5rem',
     logo: '2rem',
     text: '0.875rem'
   },
   medium: {
     container: '2rem',
     spinner: '2rem',
     logo: '3rem',
     text: '1rem'
   },
   large: {
     container: '3rem',
     spinner: '3rem',
     logo: '4rem',
     text: '1.125rem'
   }
 };

 const classes = sizeClasses[size];

 return (
   <div style={{
     display: 'flex',
     flexDirection: 'column',
     alignItems: 'center',
     justifyContent: 'center',
     padding: classes.container
   }}>
     <div style={{ position: 'relative', marginBottom: '1rem' }}>
       <div style={{
         width: classes.logo,
         height: classes.logo,
         background: '#3b82f6',
         borderRadius: '50%',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         opacity: 0.2
       }}>
         <Building2 style={{ width: '50%', height: '50%', color: 'white' }} />
       </div>
       
       <div style={{
         position: 'absolute',
         top: 0,
         left: 0,
         width: classes.spinner,
         height: classes.spinner,
         border: '4px solid #bfdbfe',
         borderTop: '4px solid #3b82f6',
         borderRadius: '50%',
         animation: 'spin 1s linear infinite'
       }} />
     </div>
     
     <p style={{
       color: '#6b7280',
       fontWeight: '500',
       fontSize: classes.text,
       textAlign: 'center',
       margin: 0
     }}>
       {message}
     </p>

     <style>{`
       @keyframes spin {
         from { transform: rotate(0deg); }
         to { transform: rotate(360deg); }
       }
     `}</style>
   </div>
 );
};

export default Loading;