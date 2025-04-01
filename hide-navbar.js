// Script específico para ocultar por completo la barra de navegación en Replit
(function() {
    function executeOnceLoaded() {
        // Remover específicamente los elementos de la barra de navegación
        const elementsToRemove = [
            // Elementos específicos de la barra de navegación
            'nav', 'header', '.navbar', '#navbar', '.toggle-bar', '.toggle-bar-spacer',
            // Elementos de la interfaz de Replit
            '[class*="monaco"]', '[class*="editor"]', '[class*="ansi"]', '.jsx-3457456006',
            '.jsx-2626493671', '.jsx-1189939650', '[class*="xterm"]', '.replit-ui-theme-root',
            '.toggle-bar-container', '[aria-label="Replit Header"]', '#replit-logo',
            '.webcontainer', '.workspace-tab-container', '.workspace-split'
        ];

        // Esta función se ejecutará repetidamente para asegurar que los elementos se oculten permanentemente
        function hideElements() {
            document.querySelectorAll(elementsToRemove.join(', ')).forEach(el => {
                if (el) {
                    el.style.cssText = `
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        height: 0 !important;
                        width: 0 !important;
                        position: absolute !important;
                        z-index: -9999 !important;
                        pointer-events: none !important;
                        left: -9999px !important;
                        top: -9999px !important;
                        max-height: 0 !important;
                        max-width: 0 !important;
                        overflow: hidden !important;
                    `;
                }
            });

            // Forzar modo fullscreen cuando sea posible
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log("Error al intentar pantalla completa:", err);
                });
            }
        }

        // Ocultar elementos inmediatamente
        hideElements();

        // Seguir ocultando elementos cada 500ms para asegurar que permanecen ocultos
        setInterval(hideElements, 500);

        // Agregar estilos directamente al body para asegurar que se aplican correctamente
        const style = document.createElement('style');
        style.innerHTML = `
            body, html {
                overflow: hidden !important;
                position: fixed !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: black !important;
            }
            
            /* Eliminar persistencia de efectos hover */
            .cta-button:hover, .secondary-button:hover, .answer:hover, .lifeline:hover, .prize-level:hover {
                transform: none !important;
                box-shadow: none !important;
                border-color: inherit !important;
                background-color: inherit !important;
            }
            
            /* Mejorar efecto active para dispositivos táctiles */
            .answer:active, .cta-button:active, .secondary-button:active, .lifeline:active {
                transform: scale(0.98) !important;
                opacity: 0.9 !important;
                background-color: rgba(255,255,255,0.05) !important;
                transition: all 0.1s ease-in-out !important;
            }
            
            /* Eliminar hover persistente */
            @media (hover: none) {
                * {
                    -webkit-tap-highlight-color: transparent !important;
                }
                
                a:hover, button:hover, .answer:hover, .prize-level:hover, .lifeline:hover {
                    background-color: inherit !important;
                    color: inherit !important;
                    border-color: inherit !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
            }
            
            /* Asegurar que la tabla de puntajes no se desplace */
            .leaderboard-table {
                max-height: 60vh !important;
                overflow-y: auto !important;
                width: 100% !important;
                margin: 0 auto !important;
            }
            
            table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            
            th, td {
                padding: 8px !important;
                text-align: center !important;
            }
            
            /* Ocultar barra de navegación de Replit */
            nav, header, .navbar, #navbar, .toggle-bar, .toggle-bar-spacer,
            [class*="monaco"], [class*="editor"], [class*="ansi"], .jsx-3457456006,
            .jsx-2626493671, .jsx-1189939650, [class*="xterm"], .replit-ui-theme-root,
            .toggle-bar-container, [aria-label="Replit Header"], #replit-logo,
            .webcontainer, .workspace-tab-container, .workspace-split {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                position: absolute !important;
                z-index: -9999 !important;
                pointer-events: none !important;
                left: -9999px !important;
                top: -9999px !important;
                max-height: 0 !important;
                max-width: 0 !important;
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);

        // Observador para detectar cambios en el DOM y seguir ocultando elementos
        const observer = new MutationObserver(hideElements);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Ejecutar cuando el DOM esté cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeOnceLoaded);
    } else {
        executeOnceLoaded();
    }

    // También ejecutar cuando la ventana esté completamente cargada
    window.addEventListener('load', executeOnceLoaded);
})();