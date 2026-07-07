import axios from "axios";

export interface HotelSlugPayload {
  slug: string;
}

export const hotelLoginService = {
  checkHotelExists: async (slug: string) => {
    const res = await axios.get(
      `/api/hotels/exists?slug=${encodeURIComponent(slug)}`,
    );
    return res.data;
  },
};
