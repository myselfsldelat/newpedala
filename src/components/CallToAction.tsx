
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Route, Users, Heart, Megaphone } from 'lucide-react';

interface CallToActionProps {
  onDiscoverClick: () => void;
}

const CallToAction: React.FC<CallToActionProps> = ({ onDiscoverClick }) => {
  return (
    <section className="py-20 bg-gradient-to-r from-event-blue to-event-green text-white">
      <div className="container px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Por Que Pedalar Conosco?
        </h2>
        
        <div className="max-w-3xl mx-auto bg-white/20 p-4 rounded-lg mb-8 backdrop-blur-sm border border-white/30">
          <h3 className="font-bold text-xl mb-2 flex items-center justify-center">
            <Megaphone className="mr-2 h-5 w-5 animate-pulse" />
            Aviso da Semana!
          </h3>
          <p className="text-white/90">
            Toda sexta é dia de superação e boas energias sobre duas rodas. O asfalto nos chama para mais uma noite incrível. Prepare sua bike, não esqueça o capacete e traga sua melhor vibe! Nosso ponto de encontro continua na <strong>Praça da Saudade</strong>. Te esperamos lá!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="font-bold text-xl mb-2 flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" /> Detalhes do Evento
            </h3>
            <ul className="text-left space-y-2">
              <li className="flex items-start">
                <MapPin className="mr-2 h-4 w-4 mt-1 flex-shrink-0" />
                <span>Ponto de Encontro: Praça da Saudade, Centro Histórico</span>
              </li>
              <li className="flex items-start">
                <Calendar className="mr-2 h-4 w-4 mt-1 flex-shrink-0" />
                <span>Data & Horário: Sexta-feira, 20h</span>
              </li>
              <li className="flex items-start">
                <Route className="mr-2 h-4 w-4 mt-1 flex-shrink-0" />
                <span>Trajeto: 10 km de passeio noturno com apoio e escolta</span>
              </li>
              <li className="flex items-start">
                <Users className="mr-2 h-4 w-4 mt-1 flex-shrink-0" />
                <span>Para quem: Ciclistas de todos os níveis</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="font-bold text-xl mb-2 flex items-center justify-center">
              <Heart className="mr-2 h-5 w-5" /> Tudo Pronto Para o Pedal?
            </h3>
            <ul className="text-left space-y-2">
              <li className="flex items-start">
                <span className="mr-2 font-bold">✅</span>
                <span>Bike revisada e pneus calibrados</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">💡</span>
                <span>Farol e luzes de segurança carregados</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">💧</span>
                <span>Hidratação é fundamental: traga sua água</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">🪖</span>
                <span>Capacete sempre!</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">😊</span>
                <span>Seu melhor sorriso e muita energia positiva!</span>
              </li>
            </ul>
          </div>
        </div>
        
        <Button 
          onClick={onDiscoverClick}
          className="bg-white text-event-green hover:bg-white/90 px-8 py-6 text-lg transition-transform hover:scale-105"
        >
          Participar do Próximo Evento
        </Button>
      </div>
    </section>
  );
};

export default CallToAction;
