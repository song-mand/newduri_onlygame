/* MOCK DATA ONLY. No real venues, coordinates, map API, Kakao or Instagram integration.
 * Replace createMockPlaceRepository with your Map API adapter implementing:
 * listRegions(): Region[], listCities(regionId): City[], listPlaces(cityId): Promise<Place[]>.
 * Place = { id, cityId, categoryId, name, isMock }. Growth consumes category counts,
 * never venue names or provider-specific objects. See README.md for integration. */
(function (root) {
  const categories = [
    { id: 'food', name: '식당', icon: '♨', color: '#eeabb2', dark: '#a55b65', title: ['작은 식당', '다정한 레스토랑', '별빛 다이닝'], reward: '딸기빛 식탁' },
    { id: 'play', name: '놀거리', icon: '✦', color: '#f7cda3', dark: '#a57543', title: ['놀이 오두막', '동네 놀이터', '꿈꾸는 유원지'], reward: '살구빛 풍선' },
    { id: 'nature', name: '자연', icon: '❋', color: '#b9d9aa', dark: '#658451', title: ['새싹 정원', '초록 온실', '숲속 식물원'], reward: '풀빛 새싹' },
    { id: 'cafe', name: '카페', icon: '☕', color: '#a9cde0', dark: '#567f95', title: ['한 잔의 카페', '구름 베이커리', '하늘빛 티하우스'], reward: '하늘빛 찻잔' },
    { id: 'landmark', name: '랜드마크', icon: '⚑', color: '#c9b6e1', dark: '#80649b', title: ['추억의 시계탑', '약속의 전망대', '우리의 작은 성'], reward: '보랏빛 왕관' }
  ];
  // Schematic region marker positions are illustration coordinates, NOT latitude/longitude.
  const definitions = [
    ['seoul','서울',230,140,'서울'],
    ['incheon','인천',165,157,'인천'],
    ['gyeonggi','경기',275,181,'수원 성남 의정부 안양 부천 광명 평택 동두천 안산 고양 과천 구리 남양주 오산 시흥 군포 의왕 하남 용인 파주 이천 안성 김포 화성 광주 양주 포천 여주'],
    ['gangwon','강원',365,114,'춘천 원주 강릉 동해 태백 속초 삼척'],
    ['chungbuk','충북',319,247,'청주 충주 제천'],
    ['chungnam','충남',202,291,'천안 공주 보령 아산 서산 논산 계룡 당진'],
    ['sejong','세종',257,272,'세종'],
    ['daejeon','대전',280,316,'대전'],
    ['gyeongbuk','경북',406,288,'포항 경주 김천 안동 구미 영주 영천 상주 문경 경산'],
    ['daegu','대구',400,367,'대구'],
    ['jeonbuk','전북',234,372,'전주 군산 익산 정읍 남원 김제'],
    ['gwangju','광주',191,443,'광주'],
    ['jeonnam','전남',237,487,'목포 여수 순천 나주 광양'],
    ['gyeongnam','경남',345,430,'창원 진주 통영 사천 김해 밀양 거제 양산'],
    ['ulsan','울산',481,393,'울산'],
    ['busan','부산',450,449,'부산'],
    ['jeju','제주',149,596,'제주 서귀포']
  ];
  const regions = definitions.map(([id,name,x,y,names]) => ({id,name,x,y,
    cities: names.split(' ').map((name,index)=>({id:id+'-'+index,name,regionId:id}))}));
  const placeNames = {
    food:['둘이 식탁','노을 파스타'], play:['반짝 공방','도란 보드게임'],
    nature:['바람 산책길','초록 수목원'], cafe:['구름 커피','오후의 찻집'],
    landmark:['달빛 전망대','약속 시계탑']
  };
  function createMockPlaceRepository() {
    return {
      listRegions: () => regions,
      listCities: regionId => regions.find(r=>r.id===regionId)?.cities || [],
      async listPlaces(cityId) {
        const city = regions.flatMap(r=>r.cities).find(c=>c.id===cityId);
        if (!city) throw new Error('알 수 없는 도시');
        return categories.flatMap(category => placeNames[category.id].map((name,index)=>({
          id:city.id+'-'+category.id+'-'+index, cityId:city.id, categoryId:category.id,
          name:city.name+' '+name, isMock:true
        })));
      }
    };
  }
  root.DuriData = {categories,regions,createMockPlaceRepository};
})(globalThis);

