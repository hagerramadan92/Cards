import { ProductI } from "./ProductsI";

export interface CategoryI {
  id: number;
  name: string;
  slug: string;
  description: string;
  children?: CategoryI[];
  order: number;
  image: string;
  sub_image: string;
   parent_id?: null;
  is_parent: boolean;
  products?: ProductI[];
  status_id?: number;
  category_banners?:any[]
}
 
       
     
       
      

      
              
              
               
               
      
             
              
      